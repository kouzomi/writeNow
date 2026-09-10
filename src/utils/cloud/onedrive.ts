import { BrowserAuthError, PublicClientApplication, type AccountInfo } from '@azure/msal-browser'
import { isLibraryBackup, type LibraryBackup } from '@/utils/backup'
import {
  CloudAuthError,
  CloudConfigError,
  CloudNetworkError,
  CloudPreconditionError,
  type CloudAdapter,
  type RemoteLibrary,
} from '@/utils/cloud/types'

const SCOPES = ['Files.ReadWrite.AppFolder']
const GRAPH = 'https://graph.microsoft.com/v1.0'
const FILE_ITEM = '/me/drive/special/approot:/library.json'
const FILE_CONTENT = `${FILE_ITEM}:/content`
const CONNECT_PENDING_KEY = 'writeNow.cloudConnect'

let pca: PublicClientApplication | null = null
let initialized = false
let initPromise: Promise<void> | null = null

const clientId = () => import.meta.env.VITE_ONEDRIVE_CLIENT_ID?.trim() ?? ''

const redirectUri = () => {
  const fromEnv = import.meta.env.VITE_ONEDRIVE_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

export const isOneDriveConfigured = () => clientId().length > 0

const accountNameOf = (account: AccountInfo | null) => {
  if (!account) return null
  return account.name?.trim() || account.username || null
}

const activeAccount = () => {
  if (!pca) return null
  return pca.getActiveAccount() ?? pca.getAllAccounts()[0] ?? null
}

const ensureApp = () => {
  if (!isOneDriveConfigured()) throw new CloudConfigError()
  if (pca) return pca
  pca = new PublicClientApplication({
    auth: {
      clientId: clientId(),
      authority: 'https://login.microsoftonline.com/consumers',
      redirectUri: redirectUri(),
    },
    cache: {
      cacheLocation: 'localStorage',
    },
  })
  return pca
}

const graphFetch = async (token: string, path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(`${GRAPH}${path}`, { ...init, headers })
  } catch {
    throw new CloudNetworkError()
  }
  if (res.status === 401) throw new CloudAuthError()
  return res
}

const readJson = async (res: Response) => {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

const getToken = async () => {
  const app = ensureApp()
  const account = activeAccount()
  if (!account) return null
  app.setActiveAccount(account)
  try {
    const silent = await app.acquireTokenSilent({ scopes: SCOPES, account })
    return silent.accessToken
  } catch {
    return null
  }
}

const isBrowserAuthCode = (error: unknown, ...codes: string[]) =>
  error instanceof BrowserAuthError && codes.includes(error.errorCode)

const clearAuthHash = () => {
  const url = new URL(window.location.href)
  if (!url.hash && !url.searchParams.has('code') && !url.searchParams.has('error')) return
  url.hash = ''
  url.searchParams.delete('code')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  url.searchParams.delete('state')
  url.searchParams.delete('session_state')
  url.searchParams.delete('client_info')
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`)
}

const connectWithRedirect = async (app: PublicClientApplication) => {
  sessionStorage.setItem(CONNECT_PENDING_KEY, '1')
  await app.loginRedirect({ scopes: SCOPES })
}

const ensureInitialized = async () => {
  const app = ensureApp()
  if (initialized) return app
  if (!initPromise) {
    initPromise = (async () => {
      await app.initialize()
      try {
        const redirect = await app.handleRedirectPromise()
        if (redirect?.account) {
          app.setActiveAccount(redirect.account)
        } else {
          const existing = activeAccount()
          if (existing) app.setActiveAccount(existing)
        }
      } catch (error) {
        // Stale popup/redirect leftovers after timed_out or a closed window.
        if (!isBrowserAuthCode(error, 'no_token_request_cache_error', 'hash_empty_error')) {
          throw error
        }
        clearAuthHash()
        const existing = activeAccount()
        if (existing) app.setActiveAccount(existing)
      }
      initialized = true
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }
  await initPromise
  return app
}

export const oneDriveAdapter: CloudAdapter = {
  id: 'onedrive',

  isConfigured: isOneDriveConfigured,

  async initialize() {
    if (!isOneDriveConfigured()) return
    await ensureInitialized()
  },

  async connect() {
    const app = await ensureInitialized()
    // Prefer full-page redirect: popup often hits timed_out on slow Microsoft login.
    await connectWithRedirect(app)
    return { accountName: 'OneDrive' }
  },

  async disconnect() {
    if (!pca || !initialized) {
      sessionStorage.removeItem(CONNECT_PENDING_KEY)
      return
    }
    const account = activeAccount()
    sessionStorage.removeItem(CONNECT_PENDING_KEY)
    try {
      if (account) {
        await pca.logoutPopup({ account })
      }
    } catch {
      await pca.clearCache()
    }
    pca.setActiveAccount(null)
  },

  getAccountName() {
    return accountNameOf(activeAccount())
  },

  isSignedIn() {
    return activeAccount() != null
  },

  async loadRemote() {
    const token = await getToken()
    if (!token) throw new CloudAuthError()
    const metaRes = await graphFetch(token, FILE_ITEM)
    if (metaRes.status === 404) return null
    if (!metaRes.ok) {
      throw new Error(`读取 OneDrive 失败（${metaRes.status}）`)
    }
    const meta = (await readJson(metaRes)) as { eTag?: string } | null
    const etag = meta?.eTag
    if (!etag) throw new Error('OneDrive 文件缺少 eTag')

    const contentRes = await graphFetch(token, FILE_CONTENT)
    if (contentRes.status === 404) return null
    if (!contentRes.ok) {
      throw new Error(`下载书库失败（${contentRes.status}）`)
    }
    const parsed = await readJson(contentRes)
    if (!isLibraryBackup(parsed)) throw new Error('云端文件不是有效的 writeNow 书库')
    return { backup: parsed, etag } satisfies RemoteLibrary
  },

  async saveRemote(backup: LibraryBackup, etag: string | null) {
    const token = await getToken()
    if (!token) throw new CloudAuthError()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (etag) headers['If-Match'] = etag
    const res = await graphFetch(token, FILE_CONTENT, {
      method: 'PUT',
      headers,
      body: JSON.stringify(backup, null, 2),
    })
    if (res.status === 412) throw new CloudPreconditionError()
    if (!res.ok) {
      throw new Error(`上传书库失败（${res.status}）`)
    }
    const saved = (await readJson(res)) as { eTag?: string } | null
    if (!saved?.eTag) throw new Error('上传成功但未返回 eTag')
    return saved.eTag
  },
}

export const tookRedirectConnect = () => {
  if (sessionStorage.getItem(CONNECT_PENDING_KEY) !== '1') return false
  sessionStorage.removeItem(CONNECT_PENDING_KEY)
  return oneDriveAdapter.isSignedIn()
}

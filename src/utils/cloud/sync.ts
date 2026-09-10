import { BrowserAuthError } from '@azure/msal-browser'
import { nextTick, reactive, watch, type WatchStopHandle } from 'vue'
import {
  applyLibraryBackup,
  backupHasContent,
  hasWritableContent,
  libraryContentKey,
  packLibraryBackup,
  type LibraryBackup,
} from '@/utils/backup'
import { explainCloudError } from '@/utils/cloud/errors'
import { oneDriveAdapter, tookRedirectConnect } from '@/utils/cloud/onedrive'
import { CloudAuthError, CloudConfigError, CloudPreconditionError } from '@/utils/cloud/types'
import { useSettingsStore } from '@/stores/settings'

const PUSH_DELAY_MS = 8000

export type CloudConflict = {
  backup: LibraryBackup
  etag: string
}

export type CloudUiStatus = 'off' | 'syncing' | 'conflict' | 'reauth' | 'error' | 'dirty' | 'ok'

export const cloudSync = reactive({
  ready: false,
  syncing: false,
  lastError: null as string | null,
  needsReauth: false,
  conflict: null as CloudConflict | null,
})

let watchStop: WatchStopHandle | null = null
let pushTimer: number | null = null
let applyingRemote = false
let started = false
let recoveryBound = false

export const isCloudConfigured = () => oneDriveAdapter.isConfigured()

export const isLibraryDirty = () => {
  const settings = useSettingsStore()
  if (!settings.cloudEnabled) return false
  return libraryContentKey(packLibraryBackup()) !== (settings.lastSyncedContentKey ?? '')
}

export const getCloudUiStatus = (): CloudUiStatus => {
  const settings = useSettingsStore()
  if (!settings.cloudEnabled) return 'off'
  if (cloudSync.syncing) return 'syncing'
  if (cloudSync.conflict) return 'conflict'
  if (cloudSync.needsReauth) return 'reauth'
  if (cloudSync.lastError) return 'error'
  if (isLibraryDirty()) return 'dirty'
  return 'ok'
}

export const labelForCloudUi = (status: CloudUiStatus) => {
  switch (status) {
    case 'syncing':
      return '同步中'
    case 'conflict':
      return '有冲突'
    case 'reauth':
      return '需重新登录'
    case 'error':
      return '同步失败'
    case 'dirty':
      return '未上传'
    case 'ok':
      return '已同步'
    default:
      return ''
  }
}

const rememberSync = (etag: string, backup: LibraryBackup) => {
  useSettingsStore().markCloudSynced(etag, libraryContentKey(backup))
  cloudSync.lastError = null
  cloudSync.needsReauth = false
}

const applyRemote = (remote: CloudConflict) => {
  applyingRemote = true
  try {
    applyLibraryBackup(remote.backup)
    rememberSync(remote.etag, remote.backup)
  } finally {
    void nextTick(() => {
      applyingRemote = false
    })
  }
}

const recordFailure = (error: unknown, fallback: string) => {
  if (error instanceof CloudAuthError || (error instanceof Error && error.message.includes('重新登录'))) {
    cloudSync.needsReauth = true
  }
  cloudSync.lastError = explainCloudError(error, fallback)
}

const isUserCancelled = (error: unknown) =>
  error instanceof BrowserAuthError && error.errorCode === 'user_cancelled'

const pushLocal = async (etag: string | null) => {
  const backup = packLibraryBackup()
  const nextEtag = await oneDriveAdapter.saveRemote(backup, etag)
  rememberSync(nextEtag, backup)
}

const clearPushTimer = () => {
  if (pushTimer == null) return
  window.clearTimeout(pushTimer)
  pushTimer = null
}

export const resolveCloudConflict = async (choice: 'local' | 'remote') => {
  const conflict = cloudSync.conflict
  if (!conflict) return
  cloudSync.syncing = true
  cloudSync.lastError = null
  try {
    if (choice === 'remote') {
      applyRemote(conflict)
    } else {
      await pushLocal(null)
    }
    cloudSync.conflict = null
  } catch (error) {
    recordFailure(error, '处理冲突失败')
  } finally {
    cloudSync.syncing = false
  }
}

const reconcile = async () => {
  const settings = useSettingsStore()
  cloudSync.syncing = true
  cloudSync.lastError = null
  try {
    const remote = await oneDriveAdapter.loadRemote()
    const local = packLibraryBackup()
    const localKey = libraryContentKey(local)
    const neverSynced = settings.lastSyncedEtag == null && settings.lastSyncedContentKey == null
    const localEmpty = !hasWritableContent()

    if (!remote) {
      if (!localEmpty) await pushLocal(null)
      return
    }

    const remoteKey = libraryContentKey(remote.backup)
    if (remoteKey === localKey) {
      rememberSync(remote.etag, remote.backup)
      return
    }

    // Local wipe / failed hydrate: never push empty over a non-empty remote.
    if (localEmpty && backupHasContent(remote.backup)) {
      applyRemote(remote)
      return
    }

    if (neverSynced) {
      if (localEmpty) {
        applyRemote(remote)
        return
      }
      if (!backupHasContent(remote.backup)) {
        await pushLocal(null)
        return
      }
      cloudSync.conflict = remote
      return
    }

    const localDirty = localKey !== settings.lastSyncedContentKey
    const remoteDirty = remote.etag !== settings.lastSyncedEtag

    if (localDirty && remoteDirty) {
      cloudSync.conflict = remote
      return
    }
    if (remoteDirty) {
      applyRemote(remote)
      return
    }
    if (localDirty) {
      try {
        await pushLocal(settings.lastSyncedEtag)
      } catch (error) {
        if (error instanceof CloudPreconditionError) {
          cloudSync.conflict = remote
          return
        }
        throw error
      }
    }
  } catch (error) {
    recordFailure(error, '同步失败')
  } finally {
    cloudSync.syncing = false
  }
}

const schedulePush = () => {
  if (applyingRemote || cloudSync.conflict || !useSettingsStore().cloudEnabled) return
  if (!isLibraryDirty()) return
  clearPushTimer()
  pushTimer = window.setTimeout(() => {
    pushTimer = null
    void flushCloudPush()
  }, PUSH_DELAY_MS)
}

export const flushCloudPush = async () => {
  clearPushTimer()
  const settings = useSettingsStore()
  if (!settings.cloudEnabled || applyingRemote || cloudSync.conflict || cloudSync.syncing) return
  if (!isLibraryDirty()) return

  const backup = packLibraryBackup()
  cloudSync.syncing = true
  cloudSync.lastError = null
  try {
    const etag = await oneDriveAdapter.saveRemote(backup, settings.lastSyncedEtag)
    rememberSync(etag, backup)
  } catch (error) {
    if (error instanceof CloudPreconditionError) {
      try {
        const remote = await oneDriveAdapter.loadRemote()
        if (!remote) {
          await pushLocal(null)
          return
        }
        if (libraryContentKey(remote.backup) === libraryContentKey(backup)) {
          rememberSync(remote.etag, remote.backup)
          return
        }
        cloudSync.conflict = remote
      } catch (inner) {
        recordFailure(inner, '同步失败')
      }
      return
    }
    recordFailure(error, '同步失败')
  } finally {
    cloudSync.syncing = false
  }
}

const startWatching = () => {
  if (watchStop) return
  watchStop = watch(
    () => libraryContentKey(packLibraryBackup()),
    () => schedulePush(),
  )
}

const stopWatching = () => {
  watchStop?.()
  watchStop = null
  clearPushTimer()
}

const retryAfterRecovery = () => {
  const settings = useSettingsStore()
  if (!settings.cloudEnabled || cloudSync.conflict || cloudSync.syncing || cloudSync.needsReauth) return
  if (isLibraryDirty()) {
    void flushCloudPush()
    return
  }
  if (cloudSync.lastError?.includes('网络不可用')) void reconcile()
}

const bindRecovery = () => {
  if (recoveryBound) return
  recoveryBound = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushCloudPush()
      return
    }
    retryAfterRecovery()
  })
  window.addEventListener('online', () => retryAfterRecovery())
}

export const startCloudSync = async () => {
  if (started) return
  started = true
  bindRecovery()

  if (!oneDriveAdapter.isConfigured()) {
    cloudSync.ready = true
    return
  }

  try {
    await oneDriveAdapter.initialize()
  } catch (error) {
    recordFailure(error, '无法初始化 OneDrive')
    cloudSync.ready = true
    return
  }

  const settings = useSettingsStore()
  if (tookRedirectConnect()) {
    settings.cloudEnabled = true
    settings.cloudAccountName = oneDriveAdapter.getAccountName()
  }

  const signedIn = oneDriveAdapter.isSignedIn()
  // Same-browser refresh can lose IndexedDB while MSAL (localStorage) remains.
  // If the library is empty, recover the cloud session and pull.
  if (signedIn && !settings.cloudEnabled && !hasWritableContent()) {
    settings.cloudEnabled = true
  }

  if (settings.cloudEnabled && signedIn) {
    settings.cloudAccountName = oneDriveAdapter.getAccountName()
    cloudSync.needsReauth = false
    await reconcile()
    startWatching()
  } else if (settings.cloudEnabled) {
    cloudSync.needsReauth = true
  }

  cloudSync.ready = true
}

export const connectOneDrive = async () => {
  if (!oneDriveAdapter.isConfigured()) throw new CloudConfigError()
  cloudSync.lastError = null
  cloudSync.syncing = true
  try {
    const { accountName } = await oneDriveAdapter.connect()
    const settings = useSettingsStore()
    settings.cloudEnabled = true
    settings.cloudAccountName = accountName
    cloudSync.needsReauth = false
    await reconcile()
    startWatching()
  } catch (error) {
    if (isUserCancelled(error)) return
    recordFailure(error, '连接失败')
    throw error
  } finally {
    cloudSync.syncing = false
  }
}

export const disconnectOneDrive = async () => {
  stopWatching()
  cloudSync.conflict = null
  cloudSync.needsReauth = false
  cloudSync.lastError = null
  useSettingsStore().clearCloudSession()
  try {
    await oneDriveAdapter.disconnect()
  } catch {
    // Local session is already cleared.
  }
}

export const syncNow = async () => {
  if (!useSettingsStore().cloudEnabled) return
  if (cloudSync.needsReauth) {
    await connectOneDrive()
    return
  }
  await reconcile()
  startWatching()
}

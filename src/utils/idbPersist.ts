import type { StorageLike } from 'pinia-plugin-persistedstate'

const DB_NAME = 'writeNow'
const DB_STORE = 'pinia'
const DB_VERSION = 1
const PINIA_KEYS = ['catalog', 'notebook', 'settings'] as const
const FLUSH_MS = 250

const memory = new Map<string, string>()
const pending = new Map<string, string>()

let dbPromise: Promise<IDBDatabase> | null = null
let useIdb = true
let flushTimer: number | null = null
let flushBound = false

const requestOf = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const openDb = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

const readAll = async () => {
  const db = await openDb()
  const tx = db.transaction(DB_STORE, 'readonly')
  const store = tx.objectStore(DB_STORE)
  const keys = await requestOf(store.getAllKeys())
  for (const key of keys) {
    const value = await requestOf(store.get(key))
    if (typeof key === 'string' && typeof value === 'string') memory.set(key, value)
  }
}

const writePending = async () => {
  if (!useIdb || pending.size === 0) return
  const batch = [...pending]
  pending.clear()
  try {
    const db = await openDb()
    const tx = db.transaction(DB_STORE, 'readwrite')
    const store = tx.objectStore(DB_STORE)
    for (const [key, value] of batch) store.put(value, key)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch (error) {
    for (const [key, value] of batch) {
      pending.set(key, value)
      localStorage.setItem(key, value)
    }
    throw error
  }
}

const scheduleFlush = () => {
  if (flushTimer != null) window.clearTimeout(flushTimer)
  flushTimer = window.setTimeout(() => {
    flushTimer = null
    void writePending().catch(() => undefined)
  }, FLUSH_MS)
}

export const flushPersistStorage = async () => {
  if (flushTimer != null) {
    window.clearTimeout(flushTimer)
    flushTimer = null
  }
  try {
    await writePending()
  } catch {
    for (const key of PINIA_KEYS) {
      const value = memory.get(key)
      if (value != null) localStorage.setItem(key, value)
    }
  }
}

const migrateFromLocalStorage = async () => {
  let copied = false
  for (const key of PINIA_KEYS) {
    const fromLs = localStorage.getItem(key)
    if (fromLs == null) continue
    // pagehide mirrors here first; prefer it over a possibly stale/incomplete IDB read.
    memory.set(key, fromLs)
    pending.set(key, fromLs)
    copied = true
  }
  if (!copied) return
  await writePending()
  for (const key of PINIA_KEYS) localStorage.removeItem(key)
}

const mirrorToLocalStorage = () => {
  for (const key of PINIA_KEYS) {
    const value = pending.get(key) ?? memory.get(key)
    if (value != null) localStorage.setItem(key, value)
  }
}

const bindFlush = () => {
  if (flushBound) return
  flushBound = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      mirrorToLocalStorage()
      void flushPersistStorage()
    }
  })
  window.addEventListener('pagehide', () => {
    // Unload can abort the async IDB write; mirror sync to localStorage first.
    mirrorToLocalStorage()
    void flushPersistStorage()
  })
}

export const preparePersistStorage = async () => {
  if (typeof indexedDB === 'undefined') {
    useIdb = false
    return
  }
  try {
    await readAll()
    await migrateFromLocalStorage()
    bindFlush()
  } catch {
    useIdb = false
    memory.clear()
    pending.clear()
  }
}

export const persistStorage: StorageLike = {
  getItem(key) {
    if (!useIdb) return localStorage.getItem(key)
    return memory.get(key) ?? null
  },
  setItem(key, value) {
    if (!useIdb) {
      localStorage.setItem(key, value)
      return
    }
    memory.set(key, value)
    pending.set(key, value)
    scheduleFlush()
  },
}

import type { LibraryBackup } from '@/utils/backup'

export type RemoteLibrary = {
  backup: LibraryBackup
  etag: string
}

export class CloudPreconditionError extends Error {
  override name = 'CloudPreconditionError'
  constructor() {
    super('云端文件已被其他设备更新')
  }
}

export class CloudConfigError extends Error {
  override name = 'CloudConfigError'
  constructor() {
    super('未配置 OneDrive 客户端 ID')
  }
}

export class CloudNetworkError extends Error {
  override name = 'CloudNetworkError'
  constructor() {
    super('网络不可用，书库仍在本机。恢复网络后会自动重试。')
  }
}

export class CloudAuthError extends Error {
  override name = 'CloudAuthError'
  constructor() {
    super('登录已过期，请重新连接 OneDrive。')
  }
}

export type CloudAdapter = {
  id: 'onedrive'
  isConfigured: () => boolean
  initialize: () => Promise<void>
  connect: () => Promise<{ accountName: string }>
  disconnect: () => Promise<void>
  getAccountName: () => string | null
  isSignedIn: () => boolean
  loadRemote: () => Promise<RemoteLibrary | null>
  saveRemote: (backup: LibraryBackup, etag: string | null) => Promise<string>
}

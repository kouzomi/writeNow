import { BrowserAuthError } from '@azure/msal-browser'
import { CloudAuthError, CloudConfigError, CloudNetworkError } from '@/utils/cloud/types'

const MSAL_MESSAGES: Record<string, string> = {
  timed_out: '登录超时。请再点连接，并在跳转后尽快完成登录。',
  no_token_request_cache_error: '上次登录未完成。请再点连接 OneDrive。',
  popup_window_error: '登录窗口被浏览器拦截。请允许弹窗，或再试一次。',
  empty_window_error: '登录窗口被关闭。请再点连接 OneDrive。',
  user_cancelled: '已取消登录。',
  interaction_in_progress: '登录还在进行中，请稍候。',
  hash_empty_error: '登录回调不完整。请再点连接 OneDrive。',
}

export const explainCloudError = (error: unknown, fallback: string) => {
  if (error instanceof CloudNetworkError || error instanceof CloudAuthError || error instanceof CloudConfigError) {
    return error.message
  }
  if (error instanceof BrowserAuthError) {
    return MSAL_MESSAGES[error.errorCode] ?? `登录失败（${error.errorCode}）。请再试一次。`
  }
  if (error instanceof TypeError) return new CloudNetworkError().message
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed|network/i.test(error.message)) {
      return new CloudNetworkError().message
    }
    return error.message
  }
  return fallback
}

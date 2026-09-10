/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONEDRIVE_CLIENT_ID?: string
  readonly VITE_ONEDRIVE_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

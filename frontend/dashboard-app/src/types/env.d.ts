/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SIGNALR_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENVIRONMENT: 'development' | 'staging' | 'production'
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_DARK_MODE: string
  readonly VITE_QUERY_STALE_TIME: string
  readonly VITE_QUERY_CACHE_TIME: string
  readonly VITE_SIGNALR_RECONNECT_INTERVAL: string
  readonly VITE_SIGNALR_MAX_RECONNECT_ATTEMPTS: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string
  readonly VITE_REFRESH_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
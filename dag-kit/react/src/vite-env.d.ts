/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: string;
  readonly VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID: string;
  readonly VITE_PUBLIC_FACEBOOK_CLIENT_ID: string;
  readonly VITE_PUBLIC_RP_ID?: string;
  readonly VITE_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  readonly VITE_PUBLIC_BASE_URL: string;
  readonly VITE_PUBLIC_ORGANIZATION_ID: string;
  readonly VITE_PUBLIC_ALCHEMY_API_KEY: string;
  readonly VITE_PUBLIC_FACEBOOK_AUTH_VERSION: string;
  readonly VITE_PUBLIC_AUTH_IFRAME_URL?: string;
  readonly VITE_PUBLIC_EXPORT_IFRAME_URL?: string;
  readonly VITE_PUBLIC_IMPORT_IFRAME_URL?: string;
  readonly VITE_PUBLIC_AUTH_PROXY_ID: string;
  readonly VITE_PUBLIC_AUTH_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

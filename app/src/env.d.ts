/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DOMAIN: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_DONATION_URL: string;
  readonly VITE_BETTER_AUTH_SECRET: string;
  readonly VITE_BETTER_AUTH_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_CLIENT_SECRET: string;
  readonly VITE_GITHUB_CLIENT_ID?: string;
  readonly VITE_GITHUB_CLIENT_SECRET?: string;
  readonly VITE_TIDAL_CLIENT_ID?: string;
  readonly VITE_TIDAL_CLIENT_SECRET?: string;
  readonly VITE_HIFI_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

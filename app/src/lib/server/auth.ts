import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";

type Env = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  DB?: D1Database;
};

function getEnv(): Env {
  return {
    BETTER_AUTH_SECRET: import.meta.env.VITE_BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: import.meta.env.VITE_BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
    DB: typeof process !== "undefined" ? (process.env as any).DB : undefined,
    // Also try Cloudflare Workers env binding
    ...(typeof globalThis !== "undefined" &&
    typeof (globalThis as any).env !== "undefined"
      ? { DB: (globalThis as any).env.DB }
      : {}),
  };
}

export function createAuth(platform: { env: Env } | null, url: string) {
  const platformEnv = platform?.env ?? {};
  const env = { ...getEnv(), ...platformEnv };
  // Get DB binding from platform.env or globalThis.env
  const dbBinding =
    platformEnv.DB ??
    (typeof globalThis !== "undefined" &&
    typeof (globalThis as any).env !== "undefined"
      ? (globalThis as any).env.DB
      : undefined);

  const result = betterAuth({
    baseURL: url,
    trustedOrigins: [
      url,
      "http://localhost:5173",
      "https://mezzo-music.pages.dev",
      "https://mezzo-61d.pages.dev",
      "https://mezzo.zenosayz05.workers.dev",
      "http://localhost",
      "https://localhost",
      "app://localhost",
      "capacitor://localhost",
      "mezzo://*",
      "com.mezzo.music://*",
    ],
    secret: env.BETTER_AUTH_SECRET || "mezzo-dev-super-secret-key-32chars-min!",
    // Converts `Authorization: Bearer <session-token>` into the session cookie,
    // so the Capacitor app (which cannot use cookies against this host) can
    // authenticate with the token persisted from sign-in/sign-up.
    plugins: [bearer()],
    database: dbBinding ?? (undefined as unknown as D1Database),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
    },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
    },
  });
  return result;
}

export function getBaseUrl(url: string, platform?: { env: Env } | null) {
  const envUrl = platform?.env?.BETTER_AUTH_URL;
  if (envUrl) return envUrl;
  return url;
}

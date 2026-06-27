/**
 * Type-safe environment configuration.
 *
 * All env vars are validated at startup. Missing required vars throw
 * immediately — fail fast, never silently degrade.
 *
 * Vite exposes only VITE_-prefixed vars to client bundles.
 * Non-prefixed vars are build-time only (vite.config.ts, etc.).
 */

type AppEnv = 'development' | 'production' | 'test'

function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(`[env] Required environment variable "${key}" is not defined.`)
  }
  return String(value)
}

function getBoolEnv(key: string, fallback: boolean): boolean {
  const raw = import.meta.env[key]
  if (raw === undefined) return fallback
  return raw === 'true' || raw === '1'
}

export const env = {
  /** Application name shown in the UI. */
  APP_NAME: getEnvVar('VITE_APP_NAME', 'FuelMS'),

  /** Semantic version from package.json injected at build time. */
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '0.1.0'),

  /** Current runtime environment. */
  NODE_ENV: (import.meta.env.MODE ?? 'development') as AppEnv,

  /** Whether the app is running inside Tauri. */
  IS_TAURI: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,

  /** Whether the app is in development mode. */
  IS_DEV: import.meta.env.DEV,

  /** Whether the app is in production mode. */
  IS_PROD: import.meta.env.PROD,

  /** Enable verbose query devtools. */
  ENABLE_QUERY_DEVTOOLS: getBoolEnv('VITE_ENABLE_QUERY_DEVTOOLS', import.meta.env.DEV),
} as const

export type Env = typeof env

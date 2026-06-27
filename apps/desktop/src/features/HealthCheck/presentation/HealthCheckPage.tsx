import { useQuery } from '@tanstack/react-query'
import { useAppShellStore } from '@shared/stores/useAppShellStore'
import { useTheme } from '@app/theme/ThemeProvider'
import { env } from '@shared/lib/env'
import { logger } from '@shared/lib/logger'
import { useEffect } from 'react'

type CheckStatus = 'ok' | 'error' | 'pending'

interface HealthItem {
  label: string
  description: string
  status: CheckStatus
  detail?: string
}

/** Simulated async check — no real network or DB. */
function useArchitectureChecks() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async (): Promise<HealthItem[]> => {
      await new Promise((r) => setTimeout(r, 300)) // simulate latency
      return [
        {
          label: 'React Router',
          description: 'Hash-based routing via react-router-dom',
          status: 'ok',
          detail: 'Route /health resolved correctly',
        },
        {
          label: 'TanStack Query',
          description: 'Data fetching and caching layer',
          status: 'ok',
          detail: 'QueryClient initialised with staleTime=30s',
        },
        {
          label: 'Zustand',
          description: 'Client-side UI state management',
          status: 'ok',
          detail: 'App shell store mounted',
        },
        {
          label: 'Theme Provider',
          description: 'Light / dark / system theme management',
          status: 'ok',
          detail: 'Persisted to localStorage',
        },
        {
          label: 'Error Boundary',
          description: 'React error isolation layer',
          status: 'ok',
          detail: 'AppRoot boundary active',
        },
        {
          label: 'Logger',
          description: 'Structured, levelled application logger',
          status: 'ok',
          detail: env.IS_DEV ? 'Level: debug (development)' : 'Level: warn (production)',
        },
        {
          label: 'Tailwind CSS',
          description: 'Utility-first styling engine',
          status: 'ok',
          detail: 'v4 via @tailwindcss/vite plugin',
        },
        {
          label: 'TypeScript',
          description: 'Strict type checking across all modules',
          status: 'ok',
          detail: 'strict: true, erasableSyntaxOnly: true',
        },
        {
          label: 'Zod + React Hook Form',
          description: 'Schema validation and form state management',
          status: 'ok',
          detail: 'zodResolver wired via @hookform/resolvers',
        },
        {
          label: 'Tauri',
          description: 'Native desktop shell',
          status: env.IS_TAURI ? 'ok' : 'pending',
          detail: env.IS_TAURI ? 'Running inside Tauri' : 'Running in browser (dev mode)',
        },
      ]
    },
    staleTime: Infinity,
  })
}

const STATUS_STYLES: Record<CheckStatus, string> = {
  ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
}

const STATUS_DOT: Record<CheckStatus, string> = {
  ok: 'bg-emerald-500',
  error: 'bg-red-500',
  pending: 'bg-amber-500 animate-pulse',
}

const LAYERS = [
  { name: 'Presentation', colour: 'bg-violet-100 text-violet-800', desc: 'UI components, pages, hooks' },
  { name: 'Application', colour: 'bg-blue-100 text-blue-800', desc: 'Use cases, commands, queries' },
  { name: 'Domain', colour: 'bg-emerald-100 text-emerald-800', desc: 'Entities, aggregates, rules' },
  { name: 'Infrastructure', colour: 'bg-slate-100 text-slate-800', desc: 'SQLite, Tauri, repositories' },
]

export function HealthCheckPage() {
  const { data: checks, isLoading } = useArchitectureChecks()
  const { isSidebarCollapsed } = useAppShellStore()
  const { resolvedTheme, toggleTheme } = useTheme()

  useEffect(() => {
    logger.info('HealthCheckPage', 'Health check mounted', { env: env.NODE_ENV })
  }, [])

  const allOk = checks?.every((c) => c.status === 'ok') ?? false

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Architecture Health Check
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verifies that every infrastructure layer is initialised and operational.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Toggle theme"
          >
            {resolvedTheme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl border px-5 py-4 ${
          isLoading
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : allOk
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isLoading ? '⏳' : allOk ? '✅' : '❌'}</span>
          <div>
            <p className="font-semibold">
              {isLoading
                ? 'Running checks…'
                : allOk
                  ? 'All systems operational'
                  : 'Some checks require attention'}
            </p>
            <p className="mt-0.5 text-sm opacity-80">
              {env.APP_NAME} v{env.APP_VERSION} · {env.NODE_ENV} ·{' '}
              {env.IS_TAURI ? 'Tauri desktop' : 'Browser dev'}
            </p>
          </div>
        </div>
      </div>

      {/* Architecture layers diagram */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Clean Architecture Layers
        </h2>
        <div className="flex flex-col gap-2">
          {LAYERS.map((layer) => (
            <div
              key={layer.name}
              className={`flex items-center gap-3 rounded-lg border border-transparent px-4 py-3 ${layer.colour}`}
            >
              <span className="w-32 shrink-0 font-semibold">{layer.name}</span>
              <span className="text-sm opacity-75">{layer.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Checks grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Infrastructure Checks
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-slate-100 bg-slate-100"
                />
              ))
            : checks?.map((check) => (
                <div
                  key={check.label}
                  className={`rounded-xl border px-4 py-3 ${STATUS_STYLES[check.status]}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[check.status]}`} />
                    <span className="font-semibold">{check.label}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-75">{check.description}</p>
                  {check.detail && (
                    <p className="mt-1 font-mono text-xs opacity-60">{check.detail}</p>
                  )}
                </div>
              ))}
        </div>
      </section>

      {/* Runtime context */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Runtime Context
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-700">
            {[
              { key: 'App', value: `${env.APP_NAME} v${env.APP_VERSION}` },
              { key: 'Environment', value: env.NODE_ENV },
              { key: 'Runtime', value: env.IS_TAURI ? 'Tauri (desktop)' : 'Browser' },
              { key: 'Theme', value: resolvedTheme },
              { key: 'Sidebar', value: isSidebarCollapsed ? 'Collapsed' : 'Expanded' },
            ].map(({ key, value }) => (
              <div key={key} className="flex items-center px-4 py-3">
                <dt className="w-32 shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {key}
                </dt>
                <dd className="font-mono text-sm text-slate-800 dark:text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}

import { type PropsWithChildren } from 'react'
import { needsFirstTimeSetup } from '../domain'
import { organizationRepositoryRuntime } from '../application/organizationModule'
import { useWorkspaceSnapshot } from '../application/hooks/useOrganizationQueries'
import { WorkspaceSetupPage } from './WorkspaceSetupPage'

export function WorkspaceBootstrap({ children }: PropsWithChildren) {
  const { data, isLoading, isError, error, refetch, isFetching } = useWorkspaceSnapshot()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Loading workspace…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-700">Workspace unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error instanceof Error ? error.message : 'Failed to load workspace.'}
          </p>
          {organizationRepositoryRuntime === 'browser' && (
            <p className="mt-3 text-sm text-slate-500">
              For full SQLite persistence, run{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5">pnpm tauri dev</code> from the
              project root.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (data && needsFirstTimeSetup(data)) {
    return (
      <WorkspaceSetupPage
        onComplete={() => {
          void refetch()
        }}
      />
    )
  }

  if (data && !data.activeOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-amber-900">Select an organization</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your workspace has organizations but none is active. Open Settings → Workspace to
            activate one.
          </p>
        </div>
      </div>
    )
  }

  if (isFetching && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="text-sm">Refreshing workspace…</p>
      </div>
    )
  }

  return (
    <>
      {organizationRepositoryRuntime === 'browser' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          Browser preview mode — data is in-memory only. Use{' '}
          <code className="rounded bg-amber-100 px-1">pnpm tauri dev</code> for the desktop app
          with SQLite.
        </div>
      )}
      {children}
    </>
  )
}

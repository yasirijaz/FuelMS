import { NavLink, Outlet } from 'react-router-dom'
import { featureRoutes } from '@app/router/routes'
import { useAppShellStore } from '@shared/stores/useAppShellStore'

export function AppLayout() {
  const { isSidebarCollapsed, toggleSidebar } = useAppShellStore()

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-950">
      <aside
        className={`border-r border-slate-200 bg-slate-950 text-white transition-all ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          {!isSidebarCollapsed && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                FuelMS
              </p>
              <p className="text-xs text-slate-500">ERP Foundation</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {featureRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={`/${route.path}`}
              className={({ isActive }) =>
                [
                  'block rounded-xl px-4 py-3 text-sm transition',
                  isActive
                    ? 'bg-white text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <span className="font-medium">
                {isSidebarCollapsed ? route.label.slice(0, 2) : route.label}
              </span>
              {!isSidebarCollapsed && (
                <span className="mt-1 block text-xs text-slate-500">
                  {route.description}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-8">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Petrol Pump Financial Operating System
            </p>
            <p className="text-xs text-slate-400">
              Architecture shell only. Business logic is intentionally absent.
            </p>
          </div>
        </header>
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

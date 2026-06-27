import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { NAV_ICONS, navigationSections } from '@app/router/navigation'
import { useAppShellStore } from '@shared/stores/useAppShellStore'
import { OrganizationSwitcher } from '@features/Organization/presentation/OrganizationSwitcher'
import { useAppBreadcrumbs } from '@app/shell/useAppBreadcrumbs'
import { useNavigationCommands } from '@app/shell/useNavigationCommands'
import { useTheme } from '@app/theme/ThemeProvider'
import { env } from '@shared/lib/env'
import {
  Breadcrumbs,
  Button,
  cn,
  ShellHeader,
  ShellLayout,
  ShellPage,
  ShellSidebar,
  useCommandPalette,
} from '@fuelms/ui'

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="space-y-1">
      {navigationSections.map((section) => {
        if (section.kind === 'link') {
          const { path, label } = section.item
          return (
            <NavLink
              key={path}
              to={`/${path}`}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--ui-radius)] px-2.5 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <span className="shrink-0 text-base">{NAV_ICONS[path] ?? '◈'}</span>
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </NavLink>
          )
        }

        return (
          <div key={section.label} className="pt-2">
            {!collapsed && (
              <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {section.label}
              </p>
            )}
            {collapsed && <div className="my-1 border-t border-white/10" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={`/${item.path}`}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-[var(--ui-radius)] px-2.5 py-2 text-sm transition-colors',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white',
                      )
                    }
                  >
                    <span className="shrink-0 text-base">{NAV_ICONS[item.path] ?? '◈'}</span>
                    {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export function AppShell() {
  const { isSidebarCollapsed, toggleSidebar } = useAppShellStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const breadcrumbs = useAppBreadcrumbs()
  const { toggleTheme, resolvedTheme } = useTheme()
  const { setOpen } = useCommandPalette()

  useNavigationCommands()

  const sidebar = (
    <ShellSidebar
      collapsed={isSidebarCollapsed}
      brand={
        <div className="flex items-center justify-between gap-2 text-white">
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-widest">{env.APP_NAME}</p>
              <p className="truncate text-[10px] text-slate-400">Enterprise ERP</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
      }
      footer={
        <NavLink
          to="/_health"
          title="Architecture Health Check"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-[var(--ui-radius)] px-2.5 py-2 text-xs transition-colors',
              isActive
                ? 'bg-emerald-500 text-white'
                : 'text-slate-500 hover:bg-white/10 hover:text-slate-300',
            )
          }
        >
          <span className="shrink-0">✦</span>
          {!isSidebarCollapsed && <span>Health Check</span>}
        </NavLink>
      }
    >
      <SidebarNav collapsed={isSidebarCollapsed} />
    </ShellSidebar>
  )

  const header = (
    <ShellHeader>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </Button>
        <div className="min-w-0">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label="Open command palette">
          ⌘K
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? '☀' : '☾'}
        </Button>
        <OrganizationSwitcher />
        <span className="hidden text-xs text-[var(--ui-text-subtle)] sm:inline">
          v{env.APP_VERSION}
        </span>
      </div>
    </ShellHeader>
  )

  return (
    <ShellLayout
      sidebar={sidebar}
      header={header}
      mobileSidebarOpen={mobileNavOpen}
      onMobileSidebarClose={() => setMobileNavOpen(false)}
    >
      <ShellPage>
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:rounded-[var(--ui-radius)] focus:bg-[var(--ui-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--ui-shadow-md)]"
        >
          Skip to content
        </a>
        <Outlet />
      </ShellPage>
    </ShellLayout>
  )
}

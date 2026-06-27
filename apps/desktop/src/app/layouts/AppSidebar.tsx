import { NavLink } from 'react-router-dom'
import { NAV_ICONS, navigationSections } from '@app/router/navigation'
import { useAppShellStore } from '@shared/stores/useAppShellStore'

function navLinkClass(isActive: boolean, collapsed: boolean): string {
  return [
    'flex items-center rounded-lg text-sm transition-colors',
    collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-2.5 py-2',
    isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white',
  ].join(' ')
}

export function AppSidebar() {
  const isSidebarCollapsed = useAppShellStore((state) => state.isSidebarCollapsed)

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {navigationSections.map((section) => {
        if (section.kind === 'link') {
          const { path, label } = section.item
          return (
            <NavLink
              key={path}
              to={`/${path}`}
              title={isSidebarCollapsed ? label : undefined}
              className={({ isActive }) => navLinkClass(isActive, isSidebarCollapsed)}
            >
              <span className="shrink-0 text-base">{NAV_ICONS[path] ?? '◈'}</span>
              {!isSidebarCollapsed && (
                <span className="min-w-0 truncate font-medium">{label}</span>
              )}
            </NavLink>
          )
        }

        return (
          <div key={section.label} className="pt-2">
            {!isSidebarCollapsed && (
              <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.label}
              </p>
            )}
            {isSidebarCollapsed && <div className="my-1 border-t border-white/10" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={`/${item.path}`}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) => navLinkClass(isActive, isSidebarCollapsed)}
                  >
                    <span className="shrink-0 text-base">{NAV_ICONS[item.path] ?? '◈'}</span>
                    {!isSidebarCollapsed && (
                      <span className="min-w-0 truncate font-medium">{item.label}</span>
                    )}
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

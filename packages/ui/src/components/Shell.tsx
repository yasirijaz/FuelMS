import { type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useMediaQuery } from '../hooks/useMediaQuery'

export type ShellLayoutProps = {
  sidebar: ReactNode
  header: ReactNode
  children: ReactNode
  mobileSidebarOpen?: boolean
  onMobileSidebarClose?: () => void
}

export function ShellLayout({
  sidebar,
  header,
  children,
  mobileSidebarOpen = false,
  onMobileSidebarClose,
}: ShellLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="flex min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)]">
      {isDesktop ? (
        <aside className="hidden w-64 shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-sidebar)] lg:flex lg:flex-col">
          {sidebar}
        </aside>
      ) : (
        mobileSidebarOpen && (
          <div className="fixed inset-0 z-[var(--ui-z-sidebar)] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation"
              onClick={onMobileSidebarClose}
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-[var(--ui-border)] bg-[var(--ui-sidebar)] shadow-[var(--ui-shadow-lg)]">
              {sidebar}
            </aside>
          </div>
        )
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ShellSidebar({
  brand,
  footer,
  children,
  collapsed,
}: {
  brand: ReactNode
  footer?: ReactNode
  children: ReactNode
  collapsed?: boolean
}) {
  return (
    <div className={cn('flex h-full flex-col', collapsed && 'items-center')}>
      <div className="shrink-0 border-b border-[var(--ui-sidebar-border)] px-3 py-3">{brand}</div>
      <div className="flex-1 overflow-y-auto p-2">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-[var(--ui-sidebar-border)] p-2">{footer}</div>
      )}
    </div>
  )
}

export function ShellHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--ui-z-header)] flex h-14 shrink-0 items-center gap-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 px-4 backdrop-blur sm:px-6',
        className,
      )}
    >
      {children}
    </header>
  )
}

export function ShellPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8', className)}>{children}</div>
}

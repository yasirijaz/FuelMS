import { Link } from 'react-router-dom'
import type { DashboardQuickAction } from '../../application/types/DashboardSnapshot'

type QuickActionsPanelProps = {
  actions: DashboardQuickAction[]
}

export function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Quick Actions</h2>
      <ul className="mt-4 space-y-2">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              to={action.to}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700/50"
            >
              <span className="text-base leading-none text-emerald-600" aria-hidden>
                +
              </span>
              {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

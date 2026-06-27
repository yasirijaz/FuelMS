import { cn } from '@fuelms/ui'
import type { ReportTabId } from '../../application/types/ReportViewTypes'
import { REPORT_TABS } from '../../application/types/ReportViewTypes'

type ReportTabNavProps = {
  activeTab: ReportTabId
  onTabChange: (tab: ReportTabId) => void
}

export function ReportTabNav({ activeTab, onTabChange }: ReportTabNavProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--ui-border)]">
      {REPORT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-[var(--ui-accent)] text-[var(--ui-text)]'
              : 'border-transparent text-[var(--ui-text-muted)] hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

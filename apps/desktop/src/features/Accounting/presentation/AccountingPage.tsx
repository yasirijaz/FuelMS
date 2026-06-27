import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { accountingRepositoryRuntime } from '../application/accountingModule'
import {
  useJournalList,
  useLedgerAccountList,
} from '../application/hooks/useAccountingQueries'
import { ChartOfAccountsTable } from './components/ChartOfAccountsTable'
import { CurrentPeriodCard } from './components/CurrentPeriodCard'
import { JournalDetailModal } from './components/JournalDetailModal'
import { JournalListTable } from './components/JournalListTable'

export function AccountingPage() {
  const accountsQuery = useLedgerAccountList(true)
  const journalsQuery = useJournalList({ limit: 50 })
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null)

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Accounting</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--ui-text-muted)]">
          Financial kernel — chart of accounts, double-entry journals, and period close controls
          that underpin automatic posting from sales, purchases, cash, and expenses.
        </p>
      </header>

      {accountingRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <CurrentPeriodCard />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Chart of accounts</h2>
        </CardHeader>
        <CardBody>
          {accountsQuery.isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {accountsQuery.error instanceof Error
                ? accountsQuery.error.message
                : 'Failed to load ledger accounts.'}
            </div>
          ) : (
            <ChartOfAccountsTable
              accounts={accountsQuery.data ?? []}
              isLoading={accountsQuery.isLoading}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Journal entries</h2>
        </CardHeader>
        <CardBody>
          {journalsQuery.isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {journalsQuery.error instanceof Error
                ? journalsQuery.error.message
                : 'Failed to load journal entries.'}
            </div>
          ) : (
            <JournalListTable
              items={journalsQuery.data ?? []}
              isLoading={journalsQuery.isLoading}
              onSelect={setSelectedJournalId}
            />
          )}
        </CardBody>
      </Card>

      <JournalDetailModal
        journalId={selectedJournalId}
        onClose={() => setSelectedJournalId(null)}
      />
    </section>
  )
}

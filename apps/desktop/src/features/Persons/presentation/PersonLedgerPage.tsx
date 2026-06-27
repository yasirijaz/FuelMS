import { useMemo, useState } from 'react'
import { Button, Card, CardBody, CardHeader, EmptyState } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  DEFAULT_PERSON_LEDGER_BALANCE_FILTERS,
  type PersonLedgerBalanceFilters,
} from '../application/types/PersonLedgerViewTypes'
import { usePersonLedgerBalanceList } from '../application/hooks/usePersonLedgerQueries'
import { personLedgerRepositoryRuntime } from '../application/personLedgerModule'
import { PersonLedgerBalanceToolbar } from './components/PersonLedgerBalanceToolbar'
import { PersonLedgerBalanceTable } from './components/PersonLedgerBalanceTable'
import { PersonLedgerDetailPanel } from './components/PersonLedgerDetailPanel'
import {
  PersonLedgerRecordModal,
  type PersonLedgerRecordAction,
} from './components/PersonLedgerRecordModal'

export function PersonLedgerPage() {
  const [filters, setFilters] = useState<PersonLedgerBalanceFilters>(
    DEFAULT_PERSON_LEDGER_BALANCE_FILTERS,
  )
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [globalAction, setGlobalAction] = useState<PersonLedgerRecordAction | null>(null)

  const { data: balances = [], isLoading, isError, error } = usePersonLedgerBalanceList(filters)

  const selectedBalance = useMemo(
    () => balances.find((item) => item.partnerId === selectedPartnerId) ?? null,
    [balances, selectedPartnerId],
  )

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
            Person Ledger
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--ui-text-muted)]">
            Running balances and transaction history for owners, employees, suppliers, and family
            members. Positive balances are receivables; negative balances are payables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setGlobalAction('borrow')}>
            Borrow
          </Button>
          <Button variant="secondary" onClick={() => setGlobalAction('lend')}>
            Lend
          </Button>
        </div>
      </header>

      {personLedgerRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <PersonLedgerBalanceToolbar filters={filters} onFiltersChange={setFilters} />
          </CardHeader>
          <CardBody>
            {isError ? (
              <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
                {error instanceof Error ? error.message : 'Failed to load person ledger balances.'}
              </div>
            ) : (
              <PersonLedgerBalanceTable
                items={balances}
                selectedPartnerId={selectedPartnerId}
                isLoading={isLoading}
                onSelectPartner={setSelectedPartnerId}
              />
            )}
          </CardBody>
        </Card>

        {selectedBalance ? (
          <PersonLedgerDetailPanel
            balance={selectedBalance}
            allBalances={balances}
            onClose={() => setSelectedPartnerId(null)}
          />
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title="Select a partner"
                description="Click a row in the balance list to view entry history and record transactions."
              />
            </CardBody>
          </Card>
        )}
      </div>

      {globalAction && (
        <PersonLedgerRecordModal
          open={Boolean(globalAction)}
          action={globalAction}
          balanceOptions={balances}
          onClose={() => setGlobalAction(null)}
        />
      )}
    </section>
  )
}

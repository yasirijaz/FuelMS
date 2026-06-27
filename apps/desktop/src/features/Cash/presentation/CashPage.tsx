import { useMemo, useState } from 'react'
import { Button, Card, CardBody, CardHeader, CashBalanceCard, TransactionTimeline } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  useCashAccountList,
  useCashTransferList,
} from '../application/hooks/useCashQueries'
import { cashRepositoryRuntime } from '../application/cashModule'
import {
  mapTransferToTimelineEntry,
  type CashAccountListItem,
} from '../application/mappers/cashViewMappers'
import { AccountFormModal } from './components/AccountFormModal'
import { CashAccountCard } from './components/CashAccountCard'
import { TransferCashModal } from './components/TransferCashModal'

export function CashPage() {
  const accountsQuery = useCashAccountList(true)
  const transfersQuery = useCashTransferList({ limit: 50 })
  const [transferOpen, setTransferOpen] = useState(false)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<CashAccountListItem | null>(null)

  const totalBalanceMinor = useMemo(() => {
    return (accountsQuery.data ?? []).reduce((sum, account) => sum + account.balanceMinor, 0)
  }, [accountsQuery.data])

  const timelineEntries = useMemo(
    () => (transfersQuery.data ?? []).map(mapTransferToTimelineEntry),
    [transfersQuery.data],
  )

  function openCreateAccount(): void {
    setEditAccount(null)
    setAccountFormOpen(true)
  }

  function openEditAccount(account: CashAccountListItem): void {
    setEditAccount(account)
    setAccountFormOpen(true)
  }

  function closeAccountForm(): void {
    setAccountFormOpen(false)
    setEditAccount(null)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Cash</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Drawer and bank balances with internal cash transfers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openCreateAccount}>
            Add account
          </Button>
          <Button onClick={() => setTransferOpen(true)} disabled={(accountsQuery.data?.length ?? 0) < 2}>
            Transfer cash
          </Button>
        </div>
      </header>

      {cashRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <CashBalanceCard label="Total cash on hand" amountMinor={totalBalanceMinor} />

      {accountsQuery.isError && (
        <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
          {accountsQuery.error instanceof Error
            ? accountsQuery.error.message
            : 'Failed to load cash accounts.'}
        </div>
      )}

      {accountsQuery.isLoading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading accounts…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountsQuery.data?.map((account) => (
            <CashAccountCard key={account.id} account={account} onEdit={openEditAccount} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Recent transfers</h2>
        </CardHeader>
        <CardBody>
          {transfersQuery.isError ? (
            <p className="text-sm text-[var(--ui-danger)]">
              {transfersQuery.error instanceof Error
                ? transfersQuery.error.message
                : 'Failed to load transfers.'}
            </p>
          ) : transfersQuery.isLoading ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Loading transfers…</p>
          ) : (
            <TransactionTimeline entries={timelineEntries} />
          )}
        </CardBody>
      </Card>

      <TransferCashModal
        open={transferOpen}
        accounts={accountsQuery.data ?? []}
        onClose={() => setTransferOpen(false)}
      />
      <AccountFormModal open={accountFormOpen} account={editAccount} onClose={closeAccountForm} />
    </section>
  )
}

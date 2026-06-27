import { useState } from 'react'
import { Button, Card, CardBody, CardHeader } from '@fuelms/ui'
import { formatMoneyDisplay } from '@fuelms/shared'
import type { PersonLedgerBalanceListItem } from '../../application/types/PersonLedgerViewTypes'
import { usePersonLedgerEntryList } from '../../application/hooks/usePersonLedgerQueries'
import { PersonLedgerEntryTable } from './PersonLedgerEntryTable'
import {
  PersonLedgerRecordModal,
  type PersonLedgerRecordAction,
} from './PersonLedgerRecordModal'

type PersonLedgerDetailPanelProps = {
  balance: PersonLedgerBalanceListItem
  allBalances: PersonLedgerBalanceListItem[]
  onClose: () => void
}

export function PersonLedgerDetailPanel({
  balance,
  allBalances,
  onClose,
}: PersonLedgerDetailPanelProps) {
  const { data: entries = [], isLoading } = usePersonLedgerEntryList(balance.partnerId)
  const [actionOpen, setActionOpen] = useState<PersonLedgerRecordAction | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ui-text)]">{balance.partnerName}</h2>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{balance.rolesLabel}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-subtle)]">
              Current balance
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
              {formatMoneyDisplay(Math.abs(balance.balanceMinor))}
            </p>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
              {balance.orientation === 'settled'
                ? 'No outstanding balance'
                : balance.orientationLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setActionOpen('borrow')}>
              Borrow
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActionOpen('repay')}>
              Repay
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActionOpen('lend')}>
              Lend
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActionOpen('collect')}>
              Collect repayment
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--ui-text)]">Entry history</h3>
            <PersonLedgerEntryTable items={entries} isLoading={isLoading} />
          </div>
        </CardBody>
      </Card>

      {actionOpen && (
        <PersonLedgerRecordModal
          open={Boolean(actionOpen)}
          action={actionOpen}
          partnerId={balance.partnerId}
          partnerName={balance.partnerName}
          balanceOptions={allBalances}
          onClose={() => setActionOpen(null)}
        />
      )}
    </>
  )
}

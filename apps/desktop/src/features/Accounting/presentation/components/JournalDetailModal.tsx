import { formatMoneyDisplay } from '@fuelms/shared'
import { Modal, ModalCloseButton, PostingStatusBadge } from '@fuelms/ui'
import { formatDate } from '@shared/utils/format'
import { useJournalDetail } from '../../application/hooks/useAccountingQueries'

type JournalDetailModalProps = {
  journalId: string | null
  onClose: () => void
}

export function JournalDetailModal({ journalId, onClose }: JournalDetailModalProps) {
  const detailQuery = useJournalDetail(journalId)
  const entry = detailQuery.data

  return (
    <Modal
      open={Boolean(journalId)}
      onClose={onClose}
      title="Journal entry"
      description={entry ? formatDate(entry.entryDate.toISOString()) : undefined}
      size="lg"
      footer={<ModalCloseButton onClick={onClose} />}
    >
      {detailQuery.isLoading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading journal lines…</p>
      ) : detailQuery.isError ? (
        <p className="text-sm text-[var(--ui-danger)]">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'Failed to load journal entry.'}
        </p>
      ) : entry ? (
        <div className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                Status
              </dt>
              <dd className="mt-1">
                <PostingStatusBadge status={entry.postingStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                Source
              </dt>
              <dd className="mt-1 text-sm text-[var(--ui-text)]">
                {entry.sourceType} · {entry.sourceId}
              </dd>
            </div>
            {entry.memo ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                  Memo
                </dt>
                <dd className="mt-1 text-sm text-[var(--ui-text)]">{entry.memo}</dd>
              </div>
            ) : null}
          </dl>

          <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
            <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                {(entry.lines ?? []).map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[var(--ui-text-muted)]">
                        {line.accountCode}
                      </span>{' '}
                      <span className="text-[var(--ui-text)]">{line.accountName}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {line.debitMinor > 0 ? formatMoneyDisplay(line.debitMinor) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {line.creditMinor > 0 ? formatMoneyDisplay(line.creditMinor) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--ui-surface-muted)] text-sm font-medium">
                <tr>
                  <td className="px-4 py-3 text-[var(--ui-text)]">Totals</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoneyDisplay(entry.totalDebitMinor)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoneyDisplay(entry.totalCreditMinor)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

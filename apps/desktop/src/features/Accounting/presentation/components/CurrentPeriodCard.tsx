import { formatDate } from '@shared/utils/format'
import { Button, Card, CardBody, CardHeader, useConfirm, useToast } from '@fuelms/ui'
import { PERIOD_STATUS_LABELS } from '../../domain'
import {
  useCloseAccountingPeriod,
  useCurrentAccountingPeriod,
  useReopenAccountingPeriod,
} from '../../application/hooks/useAccountingQueries'

function PeriodStatusBadge({ status }: { status: 'open' | 'closed' }) {
  const styles =
    status === 'open'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
      : 'border-slate-200 bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {PERIOD_STATUS_LABELS[status]}
    </span>
  )
}

export function CurrentPeriodCard() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const periodQuery = useCurrentAccountingPeriod()
  const closeMutation = useCloseAccountingPeriod()
  const reopenMutation = useReopenAccountingPeriod()

  const pending = closeMutation.isPending || reopenMutation.isPending

  async function handleClose(): Promise<void> {
    const period = periodQuery.data
    if (!period) return

    const approved = await confirm({
      title: 'Close accounting period?',
      description: `Closing ${period.periodKey} blocks new journal postings for this period.`,
      confirmLabel: 'Close period',
      variant: 'danger',
    })
    if (!approved) return

    try {
      await closeMutation.mutateAsync({ periodId: period.id, version: period.version })
      toast({ title: 'Period closed', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not close period',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleReopen(): Promise<void> {
    const period = periodQuery.data
    if (!period) return

    const approved = await confirm({
      title: 'Reopen accounting period?',
      description: `Reopening ${period.periodKey} allows journal postings again.`,
      confirmLabel: 'Reopen period',
    })
    if (!approved) return

    try {
      await reopenMutation.mutateAsync({ periodId: period.id, version: period.version })
      toast({ title: 'Period reopened', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not reopen period',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Current period</h2>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Month-end close controls for the financial kernel.
          </p>
        </div>
        {periodQuery.data && (
          <div className="flex flex-wrap gap-2">
            {periodQuery.data.status === 'open' ? (
              <Button variant="secondary" disabled={pending} onClick={() => void handleClose()}>
                Close period
              </Button>
            ) : (
              <Button variant="secondary" disabled={pending} onClick={() => void handleReopen()}>
                Reopen period
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardBody>
        {periodQuery.isLoading ? (
          <p className="text-sm text-[var(--ui-text-muted)]">Loading period…</p>
        ) : periodQuery.isError ? (
          <p className="text-sm text-[var(--ui-danger)]">
            {periodQuery.error instanceof Error
              ? periodQuery.error.message
              : 'Failed to load current period.'}
          </p>
        ) : periodQuery.data ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                Period
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-[var(--ui-text)]">
                {periodQuery.data.periodKey}
                <PeriodStatusBadge status={periodQuery.data.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                Start
              </dt>
              <dd className="mt-1 text-sm tabular-nums text-[var(--ui-text)]">
                {formatDate(periodQuery.data.startDateIso)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                End
              </dt>
              <dd className="mt-1 text-sm tabular-nums text-[var(--ui-text)]">
                {formatDate(periodQuery.data.endDateIso)}
              </dd>
            </div>
          </dl>
        ) : null}
      </CardBody>
    </Card>
  )
}

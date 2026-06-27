import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  FormField,
  Input,
  Modal,
  MoneyInput,
  Select,
  Textarea,
  useToast,
} from '@fuelms/ui'
import { minorToRupees } from '@fuelms/shared'
import { useCashAccountList } from '@features/Cash/application/hooks/useCashQueries'
import type { PersonLedgerBalanceListItem } from '../../application/types/PersonLedgerViewTypes'
import {
  useRecordPersonBorrow,
  useRecordPersonCollectLoan,
  useRecordPersonLend,
  useRecordPersonRepayBorrowed,
} from '../../application/hooks/usePersonLedgerQueries'

export type PersonLedgerRecordAction = 'borrow' | 'repay' | 'lend' | 'collect'

const ACTION_CONFIG: Record<
  PersonLedgerRecordAction,
  {
    title: string
    description: string
    submitLabel: string
    successTitle: string
    errorTitle: string
  }
> = {
  borrow: {
    title: 'Borrow from person',
    description: 'Receive cash from a partner. Increases payable (business owes partner).',
    submitLabel: 'Record borrow',
    successTitle: 'Borrow recorded',
    errorTitle: 'Could not record borrow',
  },
  repay: {
    title: 'Repay borrowed',
    description: 'Return cash to a partner to reduce payable balance.',
    submitLabel: 'Record repayment',
    successTitle: 'Repayment recorded',
    errorTitle: 'Could not record repayment',
  },
  lend: {
    title: 'Lend to person',
    description: 'Give cash to a partner. Creates a receivable (partner owes business).',
    submitLabel: 'Record loan',
    successTitle: 'Loan recorded',
    errorTitle: 'Could not record loan',
  },
  collect: {
    title: 'Collect loan repayment',
    description: 'Receive cash back from a partner to reduce receivable balance.',
    submitLabel: 'Record collection',
    successTitle: 'Collection recorded',
    errorTitle: 'Could not record collection',
  },
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type PersonLedgerRecordModalProps = {
  open: boolean
  action: PersonLedgerRecordAction
  partnerId?: string | null
  partnerName?: string
  balanceOptions?: PersonLedgerBalanceListItem[]
  onClose: () => void
}

export function PersonLedgerRecordModal({
  open,
  action,
  partnerId: fixedPartnerId,
  partnerName,
  balanceOptions = [],
  onClose,
}: PersonLedgerRecordModalProps) {
  const { toast } = useToast()
  const config = ACTION_CONFIG[action]
  const borrowMutation = useRecordPersonBorrow()
  const repayMutation = useRecordPersonRepayBorrowed()
  const lendMutation = useRecordPersonLend()
  const collectMutation = useRecordPersonCollectLoan()
  const { data: cashAccounts } = useCashAccountList(true)

  const [entryDateLocal, setEntryDateLocal] = useState(toLocalDateTimeValue(new Date()))
  const [partnerId, setPartnerId] = useState('')
  const [amountMinor, setAmountMinor] = useState<number | null>(null)
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const isPending =
    borrowMutation.isPending ||
    repayMutation.isPending ||
    lendMutation.isPending ||
    collectMutation.isPending

  const partnerChoices = useMemo(() => {
    if (balanceOptions.length > 0) {
      return balanceOptions.map((item) => ({
        id: item.partnerId,
        name: item.partnerName,
      }))
    }
    if (fixedPartnerId && partnerName) {
      return [{ id: fixedPartnerId, name: partnerName }]
    }
    return []
  }, [balanceOptions, fixedPartnerId, partnerName])

  useEffect(() => {
    if (!open) return
    setEntryDateLocal(toLocalDateTimeValue(new Date()))
    setAmountMinor(null)
    setReference('')
    setNotes('')
    setPartnerId(fixedPartnerId ?? partnerChoices[0]?.id ?? '')
  }, [open, fixedPartnerId, partnerChoices])

  useEffect(() => {
    if (!cashAccounts?.length) return
    if (!cashAccountId || !cashAccounts.some((account) => account.id === cashAccountId)) {
      setCashAccountId(cashAccounts[0]!.id)
    }
  }, [cashAccounts, cashAccountId])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!partnerId) {
      toast({ title: 'Select a partner', variant: 'error' })
      return
    }
    if (amountMinor == null || amountMinor <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'error' })
      return
    }
    if (!cashAccountId) {
      toast({ title: 'Select a cash account', variant: 'error' })
      return
    }

    const payload = {
      partnerId,
      amountRupees: minorToRupees(amountMinor),
      entryDateIso: new Date(entryDateLocal).toISOString(),
      cashAccountId,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    try {
      if (action === 'borrow') await borrowMutation.mutateAsync(payload)
      else if (action === 'repay') await repayMutation.mutateAsync(payload)
      else if (action === 'lend') await lendMutation.mutateAsync(payload)
      else await collectMutation.mutateAsync(payload)

      toast({ title: config.successTitle, variant: 'success' })
      onClose()
    } catch (caught) {
      toast({
        title: config.errorTitle,
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      description={config.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="person-ledger-record-form" disabled={isPending}>
            {config.submitLabel}
          </Button>
        </>
      }
    >
      <form id="person-ledger-record-form" onSubmit={handleSubmit} className="space-y-4">
        {fixedPartnerId && partnerName ? (
          <FormField id="person-ledger-partner" label="Partner">
            <Input id="person-ledger-partner" value={partnerName} readOnly disabled />
          </FormField>
        ) : (
          <FormField id="person-ledger-partner-select" label="Partner" required>
            <Select
              id="person-ledger-partner-select"
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
            >
              {partnerChoices.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField id="person-ledger-date" label="Entry date" required>
          <input
            id="person-ledger-date"
            type="datetime-local"
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm"
            value={entryDateLocal}
            onChange={(event) => setEntryDateLocal(event.target.value)}
          />
        </FormField>

        <MoneyInput
          id="person-ledger-amount"
          label="Amount"
          valueMinor={amountMinor}
          onChangeMinor={setAmountMinor}
          required
        />

        <FormField id="person-ledger-cash-account" label="Cash account" required>
          <Select
            id="person-ledger-cash-account"
            value={cashAccountId}
            onChange={(event) => setCashAccountId(event.target.value)}
          >
            {(cashAccounts ?? []).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="person-ledger-reference" label="Reference">
          <Input
            id="person-ledger-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Receipt or voucher number"
          />
        </FormField>

        <FormField id="person-ledger-notes" label="Notes">
          <Textarea
            id="person-ledger-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

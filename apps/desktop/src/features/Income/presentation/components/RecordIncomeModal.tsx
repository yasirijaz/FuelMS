import { useEffect, useState } from 'react'
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
import { useCashAccountList } from '@features/Cash/application/hooks/useCashQueries'
import {
  INCOME_CATEGORIES,
  INCOME_PAYMENT_STATUSES,
  incomeCategoryLabel,
  incomePaymentStatusLabel,
  type IncomeCategory,
  type IncomePaymentStatus,
} from '../../domain'
import { useRecordIncome } from '../../application/hooks/useIncomeQueries'

type RecordIncomeModalProps = {
  open: boolean
  onClose: () => void
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function RecordIncomeModal({ open, onClose }: RecordIncomeModalProps) {
  const { toast } = useToast()
  const recordMutation = useRecordIncome()
  const { data: cashAccounts } = useCashAccountList(true)

  const [incomeDateLocal, setIncomeDateLocal] = useState(toLocalDateTimeValue(new Date()))
  const [categoryCode, setCategoryCode] = useState<IncomeCategory>('rent')
  const [amountMinor, setAmountMinor] = useState<number | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<IncomePaymentStatus>('received')
  const [sourceName, setSourceName] = useState('')
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setIncomeDateLocal(toLocalDateTimeValue(new Date()))
    setCategoryCode('rent')
    setAmountMinor(null)
    setPaymentStatus('received')
    setSourceName('')
    setReference('')
    setNotes('')
  }, [open])

  useEffect(() => {
    if (!cashAccounts?.length) return
    if (!cashAccountId || !cashAccounts.some((a) => a.id === cashAccountId)) {
      setCashAccountId(cashAccounts[0]!.id)
    }
  }, [cashAccounts, cashAccountId])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!sourceName.trim()) {
      toast({ title: 'Income source is required', variant: 'error' })
      return
    }
    if (amountMinor == null || amountMinor <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'error' })
      return
    }
    if (paymentStatus === 'received' && !cashAccountId) {
      toast({ title: 'Select a cash account', variant: 'error' })
      return
    }

    try {
      await recordMutation.mutateAsync({
        incomeDateIso: new Date(incomeDateLocal).toISOString(),
        categoryCode,
        amountRupees: amountMinor / 100,
        paymentStatus,
        sourceName: sourceName.trim(),
        cashAccountId: paymentStatus === 'received' ? cashAccountId : undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Income recorded', variant: 'success' })
      onClose()
    } catch (caught) {
      toast({
        title: 'Could not record income',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record income"
      description="Non-fuel operating income such as rent, commissions, and services."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="record-income-form" disabled={recordMutation.isPending}>
            Save income
          </Button>
        </>
      }
    >
      <form id="record-income-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField id="income-date" label="Income date" required>
          <input
            id="income-date"
            type="datetime-local"
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm"
            value={incomeDateLocal}
            onChange={(event) => setIncomeDateLocal(event.target.value)}
          />
        </FormField>

        <FormField id="income-category" label="Category" required>
          <Select
            id="income-category"
            value={categoryCode}
            onChange={(event) => setCategoryCode(event.target.value as IncomeCategory)}
          >
            {INCOME_CATEGORIES.map((code) => (
              <option key={code} value={code}>
                {incomeCategoryLabel(code)}
              </option>
            ))}
          </Select>
        </FormField>

        <MoneyInput
          id="income-amount"
          label="Amount"
          valueMinor={amountMinor}
          onChangeMinor={setAmountMinor}
          required
        />

        <FormField id="income-source" label="Source" required>
          <Input
            id="income-source"
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="e.g. Tuck Shop Tenant"
          />
        </FormField>

        <FormField id="income-payment" label="Payment" required>
          <Select
            id="income-payment"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as IncomePaymentStatus)}
          >
            {INCOME_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {incomePaymentStatusLabel(status)}
              </option>
            ))}
          </Select>
        </FormField>

        {paymentStatus === 'received' && (
          <FormField id="income-cash-account" label="Received into" required>
            <Select
              id="income-cash-account"
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
        )}

        <FormField id="income-reference" label="Reference">
          <Input
            id="income-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Receipt or invoice number"
          />
        </FormField>

        <FormField id="income-notes" label="Notes">
          <Textarea
            id="income-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

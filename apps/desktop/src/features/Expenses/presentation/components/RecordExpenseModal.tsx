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
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_STATUSES,
  expenseCategoryLabel,
  expensePaymentStatusLabel,
  type ExpenseCategory,
  type ExpensePaymentStatus,
} from '../../domain'
import { useRecordExpense } from '../../application/hooks/useExpenseQueries'

type RecordExpenseModalProps = {
  open: boolean
  onClose: () => void
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function RecordExpenseModal({ open, onClose }: RecordExpenseModalProps) {
  const { toast } = useToast()
  const recordMutation = useRecordExpense()
  const { data: cashAccounts } = useCashAccountList(true)

  const [expenseDateLocal, setExpenseDateLocal] = useState(toLocalDateTimeValue(new Date()))
  const [categoryCode, setCategoryCode] = useState<ExpenseCategory>('maintenance')
  const [amountMinor, setAmountMinor] = useState<number | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<ExpensePaymentStatus>('paid')
  const [payeeName, setPayeeName] = useState('')
  const [cashAccountId, setCashAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setExpenseDateLocal(toLocalDateTimeValue(new Date()))
    setCategoryCode('maintenance')
    setAmountMinor(null)
    setPaymentStatus('paid')
    setPayeeName('')
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
    if (!payeeName.trim()) {
      toast({ title: 'Payee name is required', variant: 'error' })
      return
    }
    if (amountMinor == null || amountMinor <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'error' })
      return
    }
    if (paymentStatus === 'paid' && !cashAccountId) {
      toast({ title: 'Select a cash account', variant: 'error' })
      return
    }

    try {
      await recordMutation.mutateAsync({
        expenseDateIso: new Date(expenseDateLocal).toISOString(),
        categoryCode,
        amountRupees: amountMinor / 100,
        paymentStatus,
        payeeName: payeeName.trim(),
        cashAccountId: paymentStatus === 'paid' ? cashAccountId : undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Expense recorded', variant: 'success' })
      onClose()
    } catch (caught) {
      toast({
        title: 'Could not record expense',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record expense"
      description="Operating costs such as maintenance, utilities, and salaries."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="record-expense-form" disabled={recordMutation.isPending}>
            Save expense
          </Button>
        </>
      }
    >
      <form id="record-expense-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField id="expense-date" label="Expense date" required>
          <input
            id="expense-date"
            type="datetime-local"
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm"
            value={expenseDateLocal}
            onChange={(event) => setExpenseDateLocal(event.target.value)}
          />
        </FormField>

        <FormField id="expense-category" label="Category" required>
          <Select
            id="expense-category"
            value={categoryCode}
            onChange={(event) => setCategoryCode(event.target.value as ExpenseCategory)}
          >
            {EXPENSE_CATEGORIES.map((code) => (
              <option key={code} value={code}>
                {expenseCategoryLabel(code)}
              </option>
            ))}
          </Select>
        </FormField>

        <MoneyInput
          id="expense-amount"
          label="Amount"
          valueMinor={amountMinor}
          onChangeMinor={setAmountMinor}
          required
        />

        <FormField id="expense-payee" label="Payee" required>
          <Input
            id="expense-payee"
            value={payeeName}
            onChange={(event) => setPayeeName(event.target.value)}
            placeholder="e.g. Hassan Motors"
          />
        </FormField>

        <FormField id="expense-payment" label="Payment" required>
          <Select
            id="expense-payment"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as ExpensePaymentStatus)}
          >
            {EXPENSE_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {expensePaymentStatusLabel(status)}
              </option>
            ))}
          </Select>
        </FormField>

        {paymentStatus === 'paid' && (
          <FormField id="expense-cash-account" label="Paid from" required>
            <Select
              id="expense-cash-account"
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

        <FormField id="expense-reference" label="Reference">
          <Input
            id="expense-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Invoice or bill number"
          />
        </FormField>

        <FormField id="expense-notes" label="Notes">
          <Textarea
            id="expense-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

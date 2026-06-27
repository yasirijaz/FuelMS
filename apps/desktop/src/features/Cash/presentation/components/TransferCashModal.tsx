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
import { formatMoneyDisplay, minorToRupees } from '@fuelms/shared'
import type { CashAccountListItem } from '../../application/mappers/cashViewMappers'
import { useRecordCashTransfer } from '../../application/hooks/useCashQueries'
import { cashAccountTypeLabel } from '../../domain/valueObjects/CashAccountType'

type TransferCashModalProps = {
  open: boolean
  accounts: CashAccountListItem[]
  onClose: () => void
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function TransferCashModal({ open, accounts, onClose }: TransferCashModalProps) {
  const { toast } = useToast()
  const transferMutation = useRecordCashTransfer()

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amountMinor, setAmountMinor] = useState<number | null>(null)
  const [transferredAtLocal, setTransferredAtLocal] = useState(toLocalDateTimeValue(new Date()))
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId),
    [accounts, fromAccountId],
  )

  useEffect(() => {
    if (!open) return
    const drawer = accounts.find((account) => account.accountType === 'drawer')
    const bank = accounts.find((account) => account.accountType === 'bank')
    setFromAccountId(drawer?.id ?? accounts[0]?.id ?? '')
    setToAccountId(bank?.id ?? accounts[1]?.id ?? '')
    setAmountMinor(null)
    setTransferredAtLocal(toLocalDateTimeValue(new Date()))
    setReference('')
    setNotes('')
  }, [open, accounts])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()

    if (!fromAccountId || !toAccountId) {
      toast({ title: 'Select source and destination accounts', variant: 'error' })
      return
    }
    if (fromAccountId === toAccountId) {
      toast({ title: 'Source and destination must be different', variant: 'error' })
      return
    }
    if (amountMinor == null || amountMinor <= 0) {
      toast({ title: 'Enter a valid transfer amount', variant: 'error' })
      return
    }
    if (fromAccount && amountMinor > fromAccount.balanceMinor) {
      toast({
        title: 'Insufficient balance',
        description: `${fromAccount.name} only has ${formatMoneyDisplay(fromAccount.balanceMinor)} available.`,
        variant: 'error',
      })
      return
    }

    try {
      await transferMutation.mutateAsync({
        fromAccountId,
        toAccountId,
        amountRupees: minorToRupees(amountMinor),
        transferredAtIso: new Date(transferredAtLocal).toISOString(),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Cash transferred', variant: 'success' })
      onClose()
    } catch (caught) {
      toast({
        title: 'Could not transfer cash',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer cash"
      description="Move money between internal locations. Transfers do not affect profit."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={transferMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="transfer-cash-form" disabled={transferMutation.isPending}>
            Confirm transfer
          </Button>
        </>
      }
    >
      <form id="transfer-cash-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField id="transfer-from" label="From" required>
          <Select
            id="transfer-from"
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({cashAccountTypeLabel(account.accountType)})
              </option>
            ))}
          </Select>
        </FormField>

        {fromAccount && (
          <p className="text-xs text-[var(--ui-text-muted)]">
            Available: {formatMoneyDisplay(fromAccount.balanceMinor)}
          </p>
        )}

        <FormField id="transfer-to" label="To" required>
          <Select
            id="transfer-to"
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({cashAccountTypeLabel(account.accountType)})
              </option>
            ))}
          </Select>
        </FormField>

        <MoneyInput
          id="transfer-amount"
          label="Amount"
          valueMinor={amountMinor}
          onChangeMinor={setAmountMinor}
          required
        />

        <FormField id="transfer-at" label="Transfer time" required>
          <input
            id="transfer-at"
            type="datetime-local"
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]"
            value={transferredAtLocal}
            onChange={(event) => setTransferredAtLocal(event.target.value)}
          />
        </FormField>

        <FormField id="transfer-reference" label="Reference">
          <Input
            id="transfer-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. Daily bank deposit"
          />
        </FormField>

        <FormField id="transfer-notes" label="Notes">
          <Textarea
            id="transfer-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

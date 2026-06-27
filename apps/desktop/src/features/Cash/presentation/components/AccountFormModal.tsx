import { useEffect, useState } from 'react'
import { Button, FormField, Input, Modal, MoneyInput, Select, Textarea, useToast } from '@fuelms/ui'
import type { CashAccountListItem } from '../../application/mappers/cashViewMappers'
import { useCreateCashAccount, useUpdateCashAccount } from '../../application/hooks/useCashQueries'
import { CASH_ACCOUNT_TYPES, cashAccountTypeLabel, type CashAccountType } from '../../domain/valueObjects/CashAccountType'

type AccountFormModalProps = {
  open: boolean
  account?: CashAccountListItem | null
  onClose: () => void
}

export function AccountFormModal({ open, account, onClose }: AccountFormModalProps) {
  const { toast } = useToast()
  const createMutation = useCreateCashAccount()
  const updateMutation = useUpdateCashAccount()
  const isEdit = Boolean(account)

  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<CashAccountType>('drawer')
  const [openingBalanceMinor, setOpeningBalanceMinor] = useState<number | null>(null)
  const [displayOrder, setDisplayOrder] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (account) {
      setName(account.name)
      setAccountType(account.accountType)
      setOpeningBalanceMinor(null)
      setDisplayOrder(String(account.displayOrder))
      setNotes(account.notes ?? '')
    } else {
      setName('')
      setAccountType('drawer')
      setOpeningBalanceMinor(null)
      setDisplayOrder('0')
      setNotes('')
    }
  }, [open, account])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Account name is required', variant: 'error' })
      return
    }

    const order = Number(displayOrder)
    if (!Number.isInteger(order)) {
      toast({ title: 'Display order must be a whole number', variant: 'error' })
      return
    }

    try {
      if (isEdit && account) {
        await updateMutation.mutateAsync({
          id: account.id,
          name: name.trim(),
          displayOrder: order,
          notes: notes.trim() || undefined,
          version: account.version,
        })
        toast({ title: 'Account updated', variant: 'success' })
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          accountType,
          openingBalanceRupees:
            openingBalanceMinor != null ? openingBalanceMinor / 100 : undefined,
          displayOrder: order,
          notes: notes.trim() || undefined,
        })
        toast({ title: 'Account created', variant: 'success' })
      }
      onClose()
    } catch (caught) {
      toast({
        title: isEdit ? 'Could not update account' : 'Could not create account',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit cash account' : 'Add cash account'}
      description="Configure a money location such as drawer, bank, or safe."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField id="account-name" label="Name" required>
          <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>

        {!isEdit && (
          <>
            <FormField id="account-type" label="Type" required>
              <Select
                id="account-type"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value as CashAccountType)}
              >
                {CASH_ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {cashAccountTypeLabel(type)}
                  </option>
                ))}
              </Select>
            </FormField>

            <MoneyInput
              id="account-opening-balance"
              label="Opening balance"
              valueMinor={openingBalanceMinor}
              onChangeMinor={setOpeningBalanceMinor}
              hint="Optional starting balance for this account."
            />
          </>
        )}

        <FormField id="account-display-order" label="Display order">
          <Input
            id="account-display-order"
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
          />
        </FormField>

        <FormField id="account-notes" label="Notes">
          <Textarea
            id="account-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

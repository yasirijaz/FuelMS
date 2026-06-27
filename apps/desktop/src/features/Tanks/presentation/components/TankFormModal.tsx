import { useEffect, useState } from 'react'
import {
  Button,
  FuelProductSelector,
  FuelQuantityInput,
  FormField,
  Input,
  Modal,
  Textarea,
  useToast,
} from '@fuelms/ui'
import type { FuelProductCode } from '@fuelms/shared'
import type { TankListItem } from '../../application/mappers/tankViewMappers'
import { useCreateTank, useUpdateTank } from '../../application/hooks/useTankQueries'

type TankFormModalProps = {
  open: boolean
  tank?: TankListItem | null
  onClose: () => void
}

export function TankFormModal({ open, tank, onClose }: TankFormModalProps) {
  const { toast } = useToast()
  const createMutation = useCreateTank()
  const updateMutation = useUpdateTank()
  const isEdit = Boolean(tank)

  const [name, setName] = useState('')
  const [productCode, setProductCode] = useState<FuelProductCode>('diesel')
  const [capacityLitres, setCapacityLitres] = useState<number | null>(null)
  const [displayOrder, setDisplayOrder] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (tank) {
      setName(tank.name)
      setProductCode(tank.productCode)
      setCapacityLitres(tank.capacityLitres)
      setDisplayOrder(String(tank.displayOrder))
      setNotes(tank.notes ?? '')
    } else {
      setName('')
      setProductCode('diesel')
      setCapacityLitres(null)
      setDisplayOrder('0')
      setNotes('')
    }
  }, [open, tank])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()

    if (!name.trim()) {
      toast({ title: 'Tank name is required', variant: 'error' })
      return
    }
    if (capacityLitres == null || capacityLitres <= 0) {
      toast({ title: 'Enter a valid capacity', variant: 'error' })
      return
    }

    const order = Number(displayOrder)
    if (!Number.isInteger(order)) {
      toast({ title: 'Display order must be a whole number', variant: 'error' })
      return
    }

    try {
      if (isEdit && tank) {
        await updateMutation.mutateAsync({
          id: tank.id,
          name: name.trim(),
          capacityLitres,
          displayOrder: order,
          notes: notes.trim() || undefined,
          version: tank.version,
        })
        toast({ title: 'Tank updated', variant: 'success' })
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          productCode,
          capacityLitres,
          displayOrder: order,
          notes: notes.trim() || undefined,
        })
        toast({ title: 'Tank created', variant: 'success' })
      }
      onClose()
    } catch (caught) {
      toast({
        title: isEdit ? 'Could not update tank' : 'Could not create tank',
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
      title={isEdit ? 'Edit tank' : 'Add tank'}
      description="Configure underground tank capacity and product assignment."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="tank-form" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create tank'}
          </Button>
        </>
      }
    >
      <form id="tank-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField id="tank-name" label="Name" required>
          <Input id="tank-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>

        {!isEdit && (
          <FuelProductSelector
            value={productCode}
            onChange={(code) => code && setProductCode(code)}
          />
        )}

        <FuelQuantityInput
          id="tank-capacity"
          label="Capacity (litres)"
          valueLitres={capacityLitres}
          onChangeLitres={setCapacityLitres}
          required
        />

        <FormField id="tank-display-order" label="Display order">
          <Input
            id="tank-display-order"
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
          />
        </FormField>

        <FormField id="tank-notes" label="Notes">
          <Textarea
            id="tank-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>
      </form>
    </Modal>
  )
}

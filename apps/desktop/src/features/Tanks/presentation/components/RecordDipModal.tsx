import { useEffect, useState } from 'react'
import { Button, FormField, FuelQuantityInput, Modal, Textarea, useToast } from '@fuelms/ui'
import { formatFuelQuantity } from '@fuelms/shared'
import type { TankListItem } from '../../application/mappers/tankViewMappers'
import { useRecordTankDip, useTankDips } from '../../application/hooks/useTankQueries'

type RecordDipModalProps = {
  open: boolean
  tank: TankListItem | null
  onClose: () => void
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function RecordDipModal({ open, tank, onClose }: RecordDipModalProps) {
  const { toast } = useToast()
  const recordMutation = useRecordTankDip()
  const dipsQuery = useTankDips(open && tank ? tank.id : null, 5)

  const [readingAtLocal, setReadingAtLocal] = useState(toLocalDateTimeValue(new Date()))
  const [quantityLitres, setQuantityLitres] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setReadingAtLocal(toLocalDateTimeValue(new Date()))
    setQuantityLitres(null)
    setNotes('')
  }, [open, tank?.id])

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!tank) return

    if (quantityLitres == null || quantityLitres < 0) {
      toast({ title: 'Enter a valid dip quantity', variant: 'error' })
      return
    }
    if (quantityLitres > tank.capacityLitres) {
      toast({ title: 'Dip cannot exceed tank capacity', variant: 'error' })
      return
    }

    const readingAtIso = new Date(readingAtLocal).toISOString()

    try {
      await recordMutation.mutateAsync({
        tankId: tank.id,
        readingAtIso,
        quantityLitres,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Dip recorded', variant: 'success' })
      onClose()
    } catch (caught) {
      toast({
        title: 'Could not record dip',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  if (!tank) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record dip — ${tank.name}`}
      description="Physical dip reading for reconciliation. Does not adjust book inventory."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={recordMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="record-dip-form" disabled={recordMutation.isPending}>
            Save dip
          </Button>
        </>
      }
    >
      <form id="record-dip-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--ui-text-muted)]">
          Book stock: {formatFuelQuantity(tank.bookLitres)} · Capacity:{' '}
          {formatFuelQuantity(tank.capacityLitres)}
        </p>

        <FormField id="dip-reading-at" label="Reading time" required>
          <input
            id="dip-reading-at"
            type="datetime-local"
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]"
            value={readingAtLocal}
            onChange={(event) => setReadingAtLocal(event.target.value)}
          />
        </FormField>

        <FuelQuantityInput
          id="dip-quantity"
          label="Dip quantity (litres)"
          valueLitres={quantityLitres}
          onChangeLitres={setQuantityLitres}
          required
        />

        <FormField id="dip-notes" label="Notes">
          <Textarea
            id="dip-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </FormField>

        {dipsQuery.data && dipsQuery.data.length > 0 && (
          <div className="border-t border-[var(--ui-border)] pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-subtle)]">
              Recent dips
            </p>
            <ul className="space-y-1 text-xs text-[var(--ui-text-muted)]">
              {dipsQuery.data.map((dip) => (
                <li key={dip.id} className="flex justify-between gap-2">
                  <span>
                    {new Intl.DateTimeFormat('en-PK', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(dip.readingAtIso))}
                  </span>
                  <span className="tabular-nums">{formatFuelQuantity(dip.quantityLitres)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  )
}

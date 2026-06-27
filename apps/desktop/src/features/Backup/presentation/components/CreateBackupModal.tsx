import { FormField, Textarea } from '@fuelms/ui'

type CreateBackupFormFieldsProps = {
  notes: string
  isPending: boolean
  onNotesChange: (value: string) => void
}

export function CreateBackupFormFields({
  notes,
  isPending,
  onNotesChange,
}: CreateBackupFormFieldsProps) {
  return (
    <FormField id="backup-notes" label="Notes" hint="Optional description for this backup.">
      <Textarea
        id="backup-notes"
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="e.g. Before month-end close"
        rows={3}
        disabled={isPending}
      />
    </FormField>
  )
}

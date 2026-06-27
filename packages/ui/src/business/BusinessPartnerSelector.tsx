import type { BusinessPartnerOption } from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Label } from '../components/Label'
import { Select } from '../components/Select'
import { EmptyState } from '../components/States'
import { Spinner } from '../components/States'

export type BusinessPartnerSelectorProps = {
  id?: string
  label?: string
  value?: string | null
  onChange?: (partnerId: string | null) => void
  partners: BusinessPartnerOption[]
  isLoading?: boolean
  disabled?: boolean
  error?: string
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function BusinessPartnerSelector({
  id,
  label = 'Business partner',
  value,
  onChange,
  partners,
  isLoading,
  disabled,
  error,
  placeholder = 'Select partner…',
  emptyMessage = 'No business partners available. Add partners in Business Partners.',
  className,
}: BusinessPartnerSelectorProps) {
  const selectId = id ?? 'business-partner-selector'

  if (isLoading) {
    return (
      <div className={cn('space-y-1.5', className)}>
        <Label htmlFor={selectId}>{label}</Label>
        <div className="flex h-9 items-center gap-2 rounded-[var(--ui-radius)] border border-[var(--ui-border)] px-3">
          <Spinner className="size-4" />
          <span className="text-sm text-[var(--ui-text-muted)]">Loading partners…</span>
        </div>
      </div>
    )
  }

  if (partners.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor={selectId}>{label}</Label>
        <EmptyState title="No partners" description={emptyMessage} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        id={selectId}
        disabled={disabled}
        invalid={Boolean(error)}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {partners.map((partner) => (
          <option key={partner.id} value={partner.id}>
            {partner.displayName}
            {partner.roles?.length ? ` (${partner.roles.join(', ')})` : ''}
          </option>
        ))}
      </Select>
      {error && (
        <p className="text-xs text-[var(--ui-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

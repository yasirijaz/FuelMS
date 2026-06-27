import { FUEL_PRODUCT_CODES, fuelProductDisplayName, type FuelProductCode } from '@fuelms/shared'

type ProductFilterProps = {
  value?: FuelProductCode
  onChange: (value: FuelProductCode | undefined) => void
}

export function ProductFilter({ value, onChange }: ProductFilterProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
      Product
      <select
        className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-sm text-[var(--ui-text)]"
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value
          onChange(next.length > 0 ? (next as FuelProductCode) : undefined)
        }}
      >
        <option value="">All products</option>
        {FUEL_PRODUCT_CODES.map((code) => (
          <option key={code} value={code}>
            {fuelProductDisplayName(code)}
          </option>
        ))}
      </select>
    </label>
  )
}

import { Select, type SelectProps } from './Select'
import { cn } from '../lib/cn'

export type FilterOption = {
  value: string
  label: string
}

export type FilterBarProps = Omit<SelectProps, 'children'> & {
  label?: string
  options: FilterOption[]
  placeholder?: string
}

export function FilterBar({
  label = 'Filter',
  options,
  placeholder = 'All',
  className,
  ...props
}: FilterBarProps) {
  return (
    <div className={cn('min-w-[10rem]', className)}>
      <label className="sr-only" htmlFor={props.id}>
        {label}
      </label>
      <Select id={props.id} aria-label={label} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

export type FilterGroupProps = {
  children: React.ReactNode
  className?: string
}

export function FilterGroup({ children, className }: FilterGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  )
}

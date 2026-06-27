import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/cn'
import { Input } from './Input'

export type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  onClear?: () => void
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { className, value, onClear, ...props },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-subtle)]"
        aria-hidden
      >
        ⌕
      </span>
      <Input
        ref={ref}
        type="search"
        value={value}
        className="pl-9 pr-9"
        aria-label={props['aria-label'] ?? 'Search'}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-xs text-[var(--ui-text-subtle)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
})

import { FUEL_PRODUCT_COLORS, type FuelProductCode } from '@fuelms/shared'
import { cn, EmptyState } from '@fuelms/ui'
import type { FuelProductLedgerProductView } from '../../application/types/ReportViewTypes'

type FuelProductTAccountTableProps = {
  product: FuelProductLedgerProductView
  periodLabel: string
}

export function FuelProductTAccountTable({ product, periodLabel }: FuelProductTAccountTableProps) {
  const accent = FUEL_PRODUCT_COLORS[product.productCode as FuelProductCode]

  return (
    <section className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: accent }}
      >
        <div>
          <h3 className="text-base font-semibold text-[var(--ui-text)]">{product.productLabel}</h3>
          <p className="text-xs text-[var(--ui-text-muted)]">
            Stock on hand: {product.stockDisplay} · Period profit: {product.periodProfitDisplay}
          </p>
        </div>
      </header>

      {product.isEmpty ? (
        <EmptyState
          className="border-0"
          title="No activity in this period"
          description={`No purchases or sales for ${product.productLabel} in ${periodLabel}.`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                <th className="w-[7rem] px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
                <th className="w-[9rem] border-l-2 border-[var(--ui-border)] px-4 py-3 text-right">
                  Debit
                  <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--ui-text-subtle)]">
                    Purchase
                  </span>
                </th>
                <th className="w-[9rem] px-4 py-3 text-right">
                  Credit
                  <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--ui-text-subtle)]">
                    Sales
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
              {product.lines.map((line) => (
                <tr
                  key={line.id}
                  className={cn(
                    'hover:bg-[var(--ui-surface-muted)]',
                    line.isDraft && 'bg-amber-500/5',
                  )}
                >
                  <td className="px-4 py-3 tabular-nums text-[var(--ui-text)]">{line.dateLabel}</td>
                  <td className="px-4 py-3 text-[var(--ui-text)]">
                    <span className="block">{line.notesDisplay}</span>
                    {line.isDraft && (
                      <span className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Draft — post to finalize
                      </span>
                    )}
                  </td>
                  <td className="border-l-2 border-[var(--ui-border)] px-4 py-3 text-right tabular-nums text-red-700">
                    {line.debitDisplay}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                    {line.creditDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[var(--ui-border)] bg-[var(--ui-surface-muted)] font-semibold">
              <tr>
                <td className="px-4 py-3 text-[var(--ui-text)]" colSpan={2}>
                  Net (posted only)
                </td>
                <td className="border-l-2 border-[var(--ui-border)] px-4 py-3 text-right tabular-nums text-red-700">
                  {product.totalPurchaseDisplay}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                  {product.totalSalesDisplay}
                </td>
              </tr>
              <tr className="border-t border-[var(--ui-border)] text-[var(--ui-text-muted)]">
                <td className="px-4 py-2 text-xs font-medium" colSpan={4}>
                  Gross profit (FIFO, posted sales):{' '}
                  <span
                    className={cn(
                      'tabular-nums font-semibold',
                      product.periodProfitMinor > 0 && 'text-emerald-700',
                      product.periodProfitMinor < 0 && 'text-red-700',
                      product.periodProfitMinor === 0 && 'text-[var(--ui-text)]',
                    )}
                  >
                    {product.periodProfitDisplay}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}

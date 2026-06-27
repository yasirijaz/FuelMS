import { DataTable, EmptyState, type DataTableColumn } from '@fuelms/ui'
import type {
  FuelSalesSummaryLineView,
  FuelSalesSummaryReportView,
} from '../../application/types/ReportViewTypes'

type FuelSalesReportPanelProps = {
  report: FuelSalesSummaryReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const columns: DataTableColumn<FuelSalesSummaryLineView>[] = [
  {
    id: 'product',
    header: 'Product',
    cell: (row) => row.productLabel,
  },
  {
    id: 'sales',
    header: 'Sales',
    align: 'right',
    cell: (row) => row.saleCount.toLocaleString(),
  },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'right',
    cell: (row) => row.quantityDisplay,
  },
  {
    id: 'revenue',
    header: 'Revenue',
    align: 'right',
    cell: (row) => row.revenueDisplay,
  },
  {
    id: 'cogs',
    header: 'COGS',
    align: 'right',
    cell: (row) => row.cogsDisplay,
  },
  {
    id: 'grossProfit',
    header: 'Gross profit',
    align: 'right',
    cell: (row) => row.grossProfitDisplay,
  },
]

export function FuelSalesReportPanel({
  report,
  isLoading,
  isError,
  error,
}: FuelSalesReportPanelProps) {
  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load fuel sales summary.'}
      </div>
    )
  }

  if (!isLoading && (!report || report.isEmpty)) {
    return (
      <EmptyState
        title="No fuel sales in this period"
        description="Posted fuel sales within the selected date range will be grouped by product here."
      />
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={report?.lines ?? []}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No fuel sales in this period"
            description="Posted fuel sales within the selected date range will be grouped by product here."
          />
        }
      />
      {report && !report.isEmpty && (
        <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
          <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
              <tr>
                <th className="px-4 py-3">Totals</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">COGS</th>
                <th className="px-4 py-3 text-right">Gross profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
              <tr>
                <td className="px-4 py-3 font-semibold text-[var(--ui-text)]">All products</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {report.totalRevenueDisplay}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {report.totalCogsDisplay}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {report.totalGrossProfitDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

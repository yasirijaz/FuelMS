import {
  CashBalanceCard,
  InventorySummaryCard,
  LoadingState,
  ProfitCard,
  TankLevelIndicator,
} from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { useDashboardSnapshot } from '../application/hooks/useDashboardSnapshot'
import { QuickActionsPanel } from './components/QuickActionsPanel'
import { TodaySalesPanel } from '@features/Sales/presentation/components/TodaySalesPanel'
import { useTodaySalesSummary } from '@features/Sales/application/hooks/useSaleQueries'

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardSnapshot()
  const todaySalesQuery = useTodaySalesSummary()

  if (isLoading) {
    return <LoadingState className="m-8" />
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Dashboard is unavailable.'}
        </div>
      </div>
    )
  }

  const salesKpi = data.kpis.find((k) => k.id === 'todaySales')
  const profitKpi = data.kpis.find((k) => k.id === 'todayProfit')
  const cashKpi = data.kpis.find((k) => k.id === 'cashBalance')

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
          {env.APP_NAME}
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {salesKpi && (
          <ProfitCard label={salesKpi.label} amountMinor={salesKpi.amountMinor} />
        )}
        {profitKpi && (
          <ProfitCard label={profitKpi.label} amountMinor={profitKpi.amountMinor} />
        )}
        {cashKpi && (
          <CashBalanceCard label={cashKpi.label} amountMinor={cashKpi.amountMinor} />
        )}
      </div>

      <TodaySalesPanel
        summary={todaySalesQuery.data}
        isLoading={todaySalesQuery.isLoading}
        isError={todaySalesQuery.isError}
        error={todaySalesQuery.error}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Fuel Stock</h2>
          <div className="mt-6 space-y-5">
            {data.fuelStock.map((item) => (
              <TankLevelIndicator
                key={item.productCode}
                productCode={item.productCode}
                fillPercent={item.fillPercent}
                capacityLitres={item.capacityLitres}
              />
            ))}
          </div>
        </div>

        <QuickActionsPanel actions={data.quickActions} />
      </div>

      <InventorySummaryCard
        products={data.inventoryProducts}
        totalValuationMinor={data.inventoryProducts.reduce(
          (sum, product) => sum + (product.valuationMinor ?? 0),
          0,
        )}
      />
    </section>
  )
}

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { reportsRepositoryRuntime } from '../application/reportsModule'
import {
  DEFAULT_REPORT_DATE_RANGE,
  type ReportDateRange,
  type ReportTabId,
} from '../application/types/ReportViewTypes'
import {
  useCashPositionReport,
  useFuelProductLedgerReport,
  useFuelSalesSummaryReport,
  usePersonLedgerSummaryReport,
  useProfitLossReport,
  useTrialBalanceReport,
} from '../application/hooks/useReportQueries'
import { CashPositionReportPanel } from './components/CashPositionReportPanel'
import { FuelProductLedgerPanel } from './components/FuelProductLedgerPanel'
import { FuelSalesReportPanel } from './components/FuelSalesReportPanel'
import { PersonBalancesReportPanel } from './components/PersonBalancesReportPanel'
import { ProfitLossReportPanel } from './components/ProfitLossReportPanel'
import { ReportDateRangeToolbar } from './components/ReportDateRangeToolbar'
import { ReportTabNav } from './components/ReportTabNav'
import { TrialBalanceReportPanel } from './components/TrialBalanceReportPanel'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabId>('fuelLedger')
  const [dateRange, setDateRange] = useState<ReportDateRange>(DEFAULT_REPORT_DATE_RANGE)

  const profitLossQuery = useProfitLossReport(dateRange)
  const fuelSalesQuery = useFuelSalesSummaryReport(dateRange)
  const fuelLedgerQuery = useFuelProductLedgerReport(dateRange)
  const cashPositionQuery = useCashPositionReport()
  const personBalancesQuery = usePersonLedgerSummaryReport()
  const trialBalanceQuery = useTrialBalanceReport()

  const showDateRange =
    activeTab === 'profitLoss' || activeTab === 'fuelSales' || activeTab === 'fuelLedger'

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Reports</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--ui-text-muted)]">
          Read-only views computed from stored data — profit &amp; loss, fuel sales, cash position,
          partner balances, and trial balance.
        </p>
      </header>

      {reportsRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <ReportTabNav activeTab={activeTab} onTabChange={setActiveTab} />
          {showDateRange && (
            <ReportDateRangeToolbar range={dateRange} onRangeChange={setDateRange} />
          )}
        </CardHeader>
        <CardBody>
          {activeTab === 'profitLoss' && (
            <ProfitLossReportPanel
              report={profitLossQuery.data}
              isLoading={profitLossQuery.isLoading}
              isError={profitLossQuery.isError}
              error={profitLossQuery.error}
            />
          )}
          {activeTab === 'fuelSales' && (
            <FuelSalesReportPanel
              report={fuelSalesQuery.data}
              isLoading={fuelSalesQuery.isLoading}
              isError={fuelSalesQuery.isError}
              error={fuelSalesQuery.error}
            />
          )}
          {activeTab === 'fuelLedger' && (
            <FuelProductLedgerPanel
              report={fuelLedgerQuery.data}
              isLoading={fuelLedgerQuery.isLoading}
              isError={fuelLedgerQuery.isError}
              error={fuelLedgerQuery.error}
            />
          )}
          {activeTab === 'cashPosition' && (
            <CashPositionReportPanel
              report={cashPositionQuery.data}
              isLoading={cashPositionQuery.isLoading}
              isError={cashPositionQuery.isError}
              error={cashPositionQuery.error}
            />
          )}
          {activeTab === 'personBalances' && (
            <PersonBalancesReportPanel
              report={personBalancesQuery.data}
              isLoading={personBalancesQuery.isLoading}
              isError={personBalancesQuery.isError}
              error={personBalancesQuery.error}
            />
          )}
          {activeTab === 'trialBalance' && (
            <TrialBalanceReportPanel
              report={trialBalanceQuery.data}
              isLoading={trialBalanceQuery.isLoading}
              isError={trialBalanceQuery.isError}
              error={trialBalanceQuery.error}
            />
          )}
        </CardBody>
      </Card>
    </section>
  )
}

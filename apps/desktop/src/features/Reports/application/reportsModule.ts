import { reportsRepository, reportsRepositoryRuntime } from '../infrastructure/reportsRepositories'
import {
  GetCashPositionReportService,
  GetFuelProductLedgerReportService,
  GetFuelSalesSummaryReportService,
  GetPersonLedgerSummaryReportService,
  GetProfitLossReportService,
  GetTrialBalanceReportService,
} from './services/ReportsServices'
import type { ReportDateRangeQuery } from '../domain'

export const getProfitLossReportService = new GetProfitLossReportService(reportsRepository)
export const getFuelSalesSummaryReportService = new GetFuelSalesSummaryReportService(
  reportsRepository,
)
export const getFuelProductLedgerReportService = new GetFuelProductLedgerReportService(
  reportsRepository,
)
export const getCashPositionReportService = new GetCashPositionReportService(reportsRepository)
export const getPersonLedgerSummaryReportService = new GetPersonLedgerSummaryReportService(
  reportsRepository,
)
export const getTrialBalanceReportService = new GetTrialBalanceReportService(reportsRepository)

export const reportsQueryKeys = {
  all: ['reports'] as const,
  profitLoss: (query: ReportDateRangeQuery) =>
    [...reportsQueryKeys.all, 'profitLoss', query] as const,
  fuelSalesSummary: (query: ReportDateRangeQuery) =>
    [...reportsQueryKeys.all, 'fuelSalesSummary', query] as const,
  fuelProductLedger: (query: ReportDateRangeQuery) =>
    [...reportsQueryKeys.all, 'fuelProductLedger', query] as const,
  cashPosition: () => [...reportsQueryKeys.all, 'cashPosition'] as const,
  personLedgerSummary: () => [...reportsQueryKeys.all, 'personLedgerSummary'] as const,
  trialBalance: () => [...reportsQueryKeys.all, 'trialBalance'] as const,
}

export { reportsRepositoryRuntime }

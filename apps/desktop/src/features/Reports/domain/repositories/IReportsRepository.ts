import type { Result, AppError } from '@fuelms/core'
import type { CashPositionReport } from '../entities/CashPositionReport'
import type { FuelProductLedgerReport } from '../entities/FuelProductLedgerReport'
import type { FuelSalesSummaryReport } from '../entities/FuelSalesSummaryReport'
import type { PersonLedgerSummaryReport } from '../entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../entities/ProfitLossReport'
import type { TrialBalanceReport } from '../entities/TrialBalanceReport'
import type { ReportDateRangeQuery } from '../validation/reportSchemas'

export interface IReportsRepository {
  getProfitLoss(query: ReportDateRangeQuery): Promise<Result<ProfitLossReport, AppError>>
  getFuelSalesSummary(query: ReportDateRangeQuery): Promise<Result<FuelSalesSummaryReport, AppError>>
  getFuelProductLedger(query: ReportDateRangeQuery): Promise<Result<FuelProductLedgerReport, AppError>>
  getCashPosition(): Promise<Result<CashPositionReport, AppError>>
  getPersonLedgerSummary(): Promise<Result<PersonLedgerSummaryReport, AppError>>
  getTrialBalance(): Promise<Result<TrialBalanceReport, AppError>>
}

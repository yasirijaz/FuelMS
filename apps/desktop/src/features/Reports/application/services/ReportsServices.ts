import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IReportsRepository } from '../../domain/repositories/IReportsRepository'
import type { CashPositionReport } from '../../domain/entities/CashPositionReport'
import type { FuelProductLedgerReport } from '../../domain/entities/FuelProductLedgerReport'
import type { FuelSalesSummaryReport } from '../../domain/entities/FuelSalesSummaryReport'
import type { PersonLedgerSummaryReport } from '../../domain/entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../../domain/entities/ProfitLossReport'
import type { TrialBalanceReport } from '../../domain/entities/TrialBalanceReport'
import {
  reportDateRangeQuerySchema,
  type ReportDateRangeQuery,
} from '../../domain'

export class GetProfitLossReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(query: ReportDateRangeQuery): Promise<Result<ProfitLossReport, AppError>> {
    const parsed = reportDateRangeQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid date range.'))
    }
    return this.repository.getProfitLoss(parsed.data)
  }
}

export class GetFuelSalesSummaryReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(query: ReportDateRangeQuery): Promise<Result<FuelSalesSummaryReport, AppError>> {
    const parsed = reportDateRangeQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid date range.'))
    }
    return this.repository.getFuelSalesSummary(parsed.data)
  }
}

export class GetFuelProductLedgerReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(query: ReportDateRangeQuery): Promise<Result<FuelProductLedgerReport, AppError>> {
    const parsed = reportDateRangeQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid date range.'))
    }
    return this.repository.getFuelProductLedger(parsed.data)
  }
}

export class GetCashPositionReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(): Promise<Result<CashPositionReport, AppError>> {
    return this.repository.getCashPosition()
  }
}

export class GetPersonLedgerSummaryReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(): Promise<Result<PersonLedgerSummaryReport, AppError>> {
    return this.repository.getPersonLedgerSummary()
  }
}

export class GetTrialBalanceReportService {
  constructor(private readonly repository: IReportsRepository) {}

  async execute(): Promise<Result<TrialBalanceReport, AppError>> {
    return this.repository.getTrialBalance()
  }
}

import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ConflictError as Conflict, InfrastructureError } from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IReportsRepository } from '../domain/repositories/IReportsRepository'
import type { CashPositionReport } from '../domain/entities/CashPositionReport'
import type { FuelProductLedgerReport } from '../domain/entities/FuelProductLedgerReport'
import type { FuelSalesSummaryReport } from '../domain/entities/FuelSalesSummaryReport'
import type { PersonLedgerSummaryReport } from '../domain/entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../domain/entities/ProfitLossReport'
import type { TrialBalanceReport } from '../domain/entities/TrialBalanceReport'
import type {
  CashPositionReportDto,
  FuelProductLedgerReportDto,
  FuelSalesSummaryReportDto,
  PersonLedgerSummaryReportDto,
  ProfitLossReportDto,
  ReportCommandResult,
  ReportDateRangeQueryDto,
  TrialBalanceReportDto,
} from '../domain/dtos/ReportDtos'
import type { ReportDateRangeQuery } from '../domain/validation/reportSchemas'
import {
  mapCashPositionReportDtoToDomain,
  mapFuelProductLedgerReportDtoToDomain,
  mapFuelSalesSummaryReportDtoToDomain,
  mapPersonLedgerSummaryReportDtoToDomain,
  mapProfitLossReportDtoToDomain,
  mapTrialBalanceReportDtoToDomain,
} from '../domain/mappers/reportMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'conflict') return new Conflict(e.code, e.message)
  return new InfrastructureError(e.code, e.message)
}

async function loadInvoke() {
  if (!env.IS_TAURI) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke
}

async function invokeResult<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, AppError>> {
  try {
    const invoke = await loadInvoke()
    if (!invoke) {
      return err(
        new InfrastructureError(
          'TAURI_UNAVAILABLE',
          'Tauri backend is not available. Run the desktop app with: pnpm tauri dev',
        ),
      )
    }
    const response = await invoke<ReportCommandResult<T>>(command, args)
    if (response.ok && response.value !== undefined) return ok(response.value)
    if (response.error) return err(mapCommandError(response.error))
    return err(new InfrastructureError('UNKNOWN', 'Command returned no value or error.'))
  } catch (caught) {
    return err(
      new InfrastructureError(
        'TAURI_INVOKE_FAILED',
        caught instanceof Error ? caught.message : String(caught),
        caught,
      ),
    )
  }
}

function toDateRangeDto(query: ReportDateRangeQuery): ReportDateRangeQueryDto {
  return {
    fromDateIso: query.fromDateIso,
    toDateIso: query.toDateIso,
  }
}

export class TauriReportsRepository implements IReportsRepository {
  async getProfitLoss(query: ReportDateRangeQuery): Promise<Result<ProfitLossReport, AppError>> {
    const result = await invokeResult<ProfitLossReportDto>('report_profit_loss', {
      query: toDateRangeDto(query),
    })
    if (!result.ok) return result
    return ok(mapProfitLossReportDtoToDomain(result.value))
  }

  async getFuelSalesSummary(
    query: ReportDateRangeQuery,
  ): Promise<Result<FuelSalesSummaryReport, AppError>> {
    const result = await invokeResult<FuelSalesSummaryReportDto>('report_fuel_sales_summary', {
      query: toDateRangeDto(query),
    })
    if (!result.ok) return result
    return ok(mapFuelSalesSummaryReportDtoToDomain(result.value))
  }

  async getFuelProductLedger(
    query: ReportDateRangeQuery,
  ): Promise<Result<FuelProductLedgerReport, AppError>> {
    const result = await invokeResult<FuelProductLedgerReportDto>('report_fuel_product_ledger', {
      query: toDateRangeDto(query),
    })
    if (!result.ok) return result
    return ok(mapFuelProductLedgerReportDtoToDomain(result.value))
  }

  async getCashPosition(): Promise<Result<CashPositionReport, AppError>> {
    const result = await invokeResult<CashPositionReportDto>('report_cash_position')
    if (!result.ok) return result
    return ok(mapCashPositionReportDtoToDomain(result.value))
  }

  async getPersonLedgerSummary(): Promise<Result<PersonLedgerSummaryReport, AppError>> {
    const result = await invokeResult<PersonLedgerSummaryReportDto>('report_person_ledger_summary')
    if (!result.ok) return result
    return ok(mapPersonLedgerSummaryReportDtoToDomain(result.value))
  }

  async getTrialBalance(): Promise<Result<TrialBalanceReport, AppError>> {
    const result = await invokeResult<TrialBalanceReportDto>('report_trial_balance')
    if (!result.ok) return result
    return ok(mapTrialBalanceReportDtoToDomain(result.value))
  }
}

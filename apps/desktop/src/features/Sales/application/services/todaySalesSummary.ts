import { ok } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import type { FuelSale } from '../../domain'
import type { IFuelSaleRepository } from '../../domain/repositories/IFuelSaleRepository'
import { toLocalDateInputValue } from '@shared/utils/dateInput'
import {
  EMPTY_TODAY_SALES_BUCKET,
  type TodaySalesBucket,
  type TodaySalesSummary,
} from '../types/TodaySalesSummary'

function aggregateBucket(
  sales: FuelSale[],
  status: 'posted' | 'draft',
  dateIso: string,
): TodaySalesBucket {
  let saleCount = 0
  let quantityMilliLitres = 0
  let revenueMinor = 0

  for (const sale of sales) {
    if (sale.status !== status) continue
    if (toLocalDateInputValue(sale.saleDate) !== dateIso) continue
    saleCount += 1
    quantityMilliLitres += sale.quantityMilliLitres
    revenueMinor += sale.totalRevenueMinor
  }

  return {
    saleCount,
    quantityLitres: quantityMilliLitres / 1000,
    revenueMinor,
  }
}

export function buildTodaySalesSummary(
  sales: FuelSale[],
  dateIso: string = toLocalDateInputValue(new Date()),
): TodaySalesSummary {
  return {
    dateIso,
    posted: aggregateBucket(sales, 'posted', dateIso),
    draft: aggregateBucket(sales, 'draft', dateIso),
  }
}

export class GetTodaySalesSummaryService {
  constructor(
    private readonly repository: IFuelSaleRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<Result<TodaySalesSummary, AppError>> {
    const salesResult = await this.repository.list({})
    if (!salesResult.ok) return salesResult

    const dateIso = toLocalDateInputValue(this.clock())
    return ok(buildTodaySalesSummary(salesResult.value, dateIso))
  }
}

export function hasTodaySalesActivity(summary: TodaySalesSummary): boolean {
  return summary.posted.saleCount > 0 || summary.draft.saleCount > 0
}

export function emptyTodaySalesSummary(dateIso: string = toLocalDateInputValue(new Date())): TodaySalesSummary {
  return {
    dateIso,
    posted: { ...EMPTY_TODAY_SALES_BUCKET },
    draft: { ...EMPTY_TODAY_SALES_BUCKET },
  }
}

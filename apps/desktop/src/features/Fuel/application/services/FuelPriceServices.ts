import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import {
  FuelPriceRecord,
  FuelProductId,
  PricePerLitre,
  EffectiveDateTime,
  recordFuelPriceInputSchema,
  priceHistoryFilterSchema,
  type RecordFuelPriceInput,
  type PriceHistoryFilter,
  type IFuelProductRepository,
  type IFuelPriceRecordRepository,
} from '../../domain/priceManagement'
import { FuelPriceRecordId as FuelPriceRecordIdFactory } from '../../domain/priceManagement/ids/FuelPriceRecordId'
import {
  buildActivePriceViews,
  mapRecordToHistoryEntry,
  mapRecordToScheduledView,
} from './fuelPriceViewMappers'
import type { FuelPriceOverview, PriceHistoryEntry, ScheduledFuelPriceView } from '../types/FuelPriceViews'

/** Default actor until authentication is introduced. */
export const FUEL_PRICE_DEFAULT_ACTOR = 'owner'

export class ListFuelPriceOverviewService {
  constructor(
    private readonly productRepository: IFuelProductRepository,
    private readonly priceRepository: IFuelPriceRecordRepository,
  ) {}

  async execute(): Promise<Result<FuelPriceOverview, AppError>> {
    const [productsResult, activeResult] = await Promise.all([
      this.productRepository.findAllActive(),
      this.priceRepository.findAllActive(),
    ])
    if (!productsResult.ok) return productsResult
    if (!activeResult.ok) return activeResult

    const products = productsResult.value
    const activePrices = buildActivePriceViews(products, activeResult.value)

    const scheduledResults = await Promise.all(
      products.map((product) => this.priceRepository.findScheduledByProductId(product.id)),
    )
    for (const result of scheduledResults) {
      if (!result.ok) return result
    }

    const productNameById = new Map(products.map((p) => [p.id.toString(), p.name]))
    const scheduledPrices: ScheduledFuelPriceView[] = []
    for (let index = 0; index < scheduledResults.length; index += 1) {
      const result = scheduledResults[index]!
      if (!result.ok) continue
      const product = products[index]!
      for (const record of result.value) {
        scheduledPrices.push(
          mapRecordToScheduledView(record, productNameById.get(product.id.toString()) ?? product.name),
        )
      }
    }

    scheduledPrices.sort(
      (a, b) => new Date(a.effectiveFromIso).getTime() - new Date(b.effectiveFromIso).getTime(),
    )

    return ok({ activePrices, scheduledPrices })
  }
}

export class GetPriceHistoryService {
  constructor(
    private readonly productRepository: IFuelProductRepository,
    private readonly priceRepository: IFuelPriceRecordRepository,
  ) {}

  async execute(filter: PriceHistoryFilter): Promise<Result<PriceHistoryEntry[], AppError>> {
    const parsed = priceHistoryFilterSchema.safeParse(filter)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid history filter.'))
    }

    let productId: FuelProductId | undefined
    if (parsed.data.productCode) {
      const product = await this.productRepository.findByCode(parsed.data.productCode)
      if (!product.ok) return product
      productId = product.value.id
    }

    const history = await this.priceRepository.findHistory({
      productId,
      fromIso: parsed.data.fromIso,
      toIso: parsed.data.toIso,
      limit: parsed.data.limit,
    })
    if (!history.ok) return history

    return ok(history.value.map(mapRecordToHistoryEntry))
  }
}

export class RecordFuelPriceService {
  constructor(
    private readonly productRepository: IFuelProductRepository,
    private readonly priceRepository: IFuelPriceRecordRepository,
  ) {}

  async execute(
    input: RecordFuelPriceInput,
    recordedBy: string = FUEL_PRICE_DEFAULT_ACTOR,
  ): Promise<Result<FuelPriceRecord, AppError>> {
    const parsed = recordFuelPriceInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid price input.'))
    }

    const product = await this.productRepository.findByCode(parsed.data.productCode)
    if (!product.ok) return product

    const priceResult = PricePerLitre.fromRupees(parsed.data.priceRupees)
    if (!priceResult.ok) return priceResult

    const effectiveFromResult = EffectiveDateTime.fromIso(parsed.data.effectiveFromIso)
    if (!effectiveFromResult.ok) return effectiveFromResult

    const recordResult = FuelPriceRecord.record({
      productId: product.value.id,
      productCode: product.value.code,
      pricePerLitre: priceResult.value,
      effectiveFrom: effectiveFromResult.value,
      recordedBy,
      reason: parsed.data.reason,
      reference: parsed.data.reference,
    })
    if (!recordResult.ok) return recordResult

    const saved = await this.priceRepository.saveNew(recordResult.value)
    if (!saved.ok) return saved

    return ok(saved.value.record)
  }
}

export class CancelScheduledFuelPriceService {
  constructor(private readonly priceRepository: IFuelPriceRecordRepository) {}

  async execute(recordId: string): Promise<Result<void, AppError>> {
    if (!recordId.trim()) {
      return err(new ValidationError('Price record is required.'))
    }

    const existing = await this.priceRepository.findById(
      FuelPriceRecordIdFactory.fromPersisted(recordId),
    )
    if (!existing.ok) return existing

    const cancelResult = existing.value.cancel()
    if (!cancelResult.ok) return cancelResult

    return this.priceRepository.update(existing.value)
  }
}

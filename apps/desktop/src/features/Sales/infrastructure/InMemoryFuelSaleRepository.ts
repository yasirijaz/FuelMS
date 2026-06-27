import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ConflictError } from '@fuelms/core'
import { isFuelProductCode } from '@fuelms/shared'
import { InMemoryRepository } from '@fuelms/testing'
import {
  FuelSale,
  FuelSaleId,
  allocateFifo,
  fifoErrorMessage,
  isSalePaymentMethod,
  mapFuelSaleToDto,
} from '../domain'
import type {
  PostFuelSaleInputDto,
  ProductStockDto,
  RecordFuelSaleInputDto,
  VoidFuelSaleInputDto,
} from '../domain/dtos/SaleDtos'
import type { IFuelSaleRepository } from '../domain/repositories/IFuelSaleRepository'
import type { FuelSaleListQuery } from '../domain/validation/saleSchemas'
import { isDateInRange } from '@shared/utils/dateInput'

const PRODUCT_IDS: Record<string, string> = {
  petrol: 'product-petrol',
  diesel: 'product-diesel',
  hobc: 'product-hobc',
}

interface InMemoryInventoryBatch {
  id: string
  productCode: string
  remainingMilliLitres: number
  unitCostMinorPerLitre: number
  receivedAt: Date
  createdAt: Date
}

function matchesSearch(sale: FuelSale, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term.length === 0) return true

  const haystack = [
    sale.customerName ?? '',
    sale.reference ?? '',
    sale.id.toString(),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(term)
}

export class InMemoryFuelSaleRepository
  extends InMemoryRepository<FuelSale, FuelSaleId>
  implements IFuelSaleRepository
{
  protected readonly entityType = 'FuelSale'

  private readonly batches: InMemoryInventoryBatch[] = []

  constructor() {
    super()
    const now = new Date('2026-06-26T09:00:00.000Z')
    this.batches.push({
      id: 'batch-seed-diesel',
      productCode: 'diesel',
      remainingMilliLitres: 10_000_000,
      unitCostMinorPerLitre: 28_000,
      receivedAt: now,
      createdAt: now,
    })
  }

  async list(query: FuelSaleListQuery): Promise<Result<FuelSale[], AppError>> {
    let sales = this.all()

    if (query.status) {
      sales = sales.filter((sale) => sale.status === query.status)
    }

    if (query.search) {
      sales = sales.filter((sale) => matchesSearch(sale, query.search!))
    }

    if (query.fromDateIso || query.toDateIso) {
      sales = sales.filter((sale) =>
        isDateInRange(sale.saleDate.toISOString(), query.fromDateIso, query.toDateIso),
      )
    }

    sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())

    return ok(sales)
  }

  async getAvailableStock(productCode: string): Promise<Result<ProductStockDto, AppError>> {
    if (!isFuelProductCode(productCode)) {
      return err(new ConflictError('INVALID_PRODUCT', 'Invalid fuel product.'))
    }

    const availableMilliLitres = this.batches
      .filter((batch) => batch.productCode === productCode && batch.remainingMilliLitres > 0)
      .reduce((sum, batch) => sum + batch.remainingMilliLitres, 0)

    return ok({ productCode, availableMilliLitres })
  }

  async record(input: RecordFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    if (input.quantityMilliLitres <= 0) {
      return err(new ConflictError('INVALID_QUANTITY', 'Quantity must be greater than zero.'))
    }
    if (input.unitPriceMinorPerLitre <= 0) {
      return err(new ConflictError('INVALID_PRICE', 'Selling price must be greater than zero.'))
    }
    if (!isSalePaymentMethod(input.paymentMethod)) {
      return err(new ConflictError('INVALID_PAYMENT_METHOD', 'Invalid payment method.'))
    }
    if (input.paymentMethod === 'credit' && !input.customerPartnerId) {
      return err(
        new ConflictError('CUSTOMER_REQUIRED', 'Customer is required for credit sales.'),
      )
    }
    if (!isFuelProductCode(input.productCode)) {
      return err(new ConflictError('INVALID_PRODUCT', 'Invalid fuel product.'))
    }
    if (!input.fuelPriceRecordId.trim()) {
      return err(
        new ConflictError(
          'INVALID_PRICE_RECORD',
          'Active fuel price record is required for this product.',
        ),
      )
    }

    const productId = PRODUCT_IDS[input.productCode]
    const totalRevenueMinor = FuelSale.computeTotal(
      input.quantityMilliLitres,
      input.unitPriceMinorPerLitre,
    )
    if (totalRevenueMinor <= 0) {
      return err(new ConflictError('INVALID_TOTAL', 'Sale total must be greater than zero.'))
    }

    const now = new Date()
    const id = FuelSaleId.create()
    let status: FuelSale['status'] = 'draft'
    let totalCogsMinor = 0

    if (input.postImmediately) {
      const cogsResult = this.applyFifoConsumption(input.productCode, input.quantityMilliLitres)
      if (!cogsResult.ok) return cogsResult
      totalCogsMinor = cogsResult.value
      status = 'posted'
    }

    const sale = FuelSale.reconstitute({
      id,
      saleDate: new Date(input.saleDateIso),
      productId,
      productCode: input.productCode,
      customerPartnerId: input.customerPartnerId ?? null,
      customerName: null,
      quantityMilliLitres: input.quantityMilliLitres,
      unitPriceMinorPerLitre: input.unitPriceMinorPerLitre,
      fuelPriceRecordId: input.fuelPriceRecordId,
      totalRevenueMinor,
      totalCogsMinor,
      paymentMethod: input.paymentMethod,
      reference: FuelSale.trimOptionalText(input.reference),
      notes: FuelSale.trimOptionalText(input.notes),
      status,
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
    })

    await this.save(sale)
    return ok(sale)
  }

  async post(input: PostFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    const existing = await this.findById(FuelSaleId.fromPersisted(input.saleId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'SALE_VERSION_CONFLICT',
          'Sale was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (!existing.value.canPost()) {
      return err(new ConflictError('SALE_NOT_DRAFT', 'Only draft sales can be posted.'))
    }

    const cogsResult = this.applyFifoConsumption(
      existing.value.productCode,
      existing.value.quantityMilliLitres,
    )
    if (!cogsResult.ok) return cogsResult

    existing.value.markPosted(cogsResult.value)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  async void(input: VoidFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    const existing = await this.findById(FuelSaleId.fromPersisted(input.saleId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'SALE_VERSION_CONFLICT',
          'Sale was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (!existing.value.canVoid()) {
      return err(new ConflictError('SALE_NOT_DRAFT', 'Only draft sales can be voided.'))
    }

    existing.value.markVoid()
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  private loadFifoBatches(productCode: string): InMemoryInventoryBatch[] {
    return this.batches
      .filter((batch) => batch.productCode === productCode && batch.remainingMilliLitres > 0)
      .sort(
        (a, b) =>
          a.receivedAt.getTime() - b.receivedAt.getTime() ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
  }

  private applyFifoConsumption(
    productCode: string,
    quantityMilliLitres: number,
  ): Result<number, AppError> {
    const sorted = this.loadFifoBatches(productCode)
    const fifoBatches = sorted.map((batch) => ({
      id: batch.id,
      remainingMilliLitres: batch.remainingMilliLitres,
      unitCostMinorPerLitre: batch.unitCostMinorPerLitre,
    }))

    const allocation = allocateFifo(fifoBatches, quantityMilliLitres)
    if (!allocation.ok) {
      return err(new ConflictError('INSUFFICIENT_STOCK', fifoErrorMessage(allocation.error)))
    }

    let totalCogsMinor = 0
    for (const line of allocation.value) {
      totalCogsMinor += line.costMinor
      const batch = this.batches.find((entry) => entry.id === line.batchId)
      if (batch) {
        batch.remainingMilliLitres -= line.quantityMilliLitres
      }
    }

    return ok(totalCogsMinor)
  }

  /** Test helper — expose DTO snapshot. */
  toDto(sale: FuelSale) {
    return mapFuelSaleToDto(sale)
  }
}

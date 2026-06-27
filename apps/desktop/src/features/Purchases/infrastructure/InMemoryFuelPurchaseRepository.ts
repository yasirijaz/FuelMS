import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ConflictError } from '@fuelms/core'
import { isFuelProductCode } from '@fuelms/shared'
import { InMemoryRepository } from '@fuelms/testing'
import {
  FuelPurchase,
  FuelPurchaseId,
  isPurchasePaymentStatus,
  mapFuelPurchaseToDto,
} from '../domain'
import type {
  PostFuelPurchaseInputDto,
  RecordFuelPurchaseInputDto,
  VoidFuelPurchaseInputDto,
} from '../domain/dtos/PurchaseDtos'
import type { IFuelPurchaseRepository } from '../domain/repositories/IFuelPurchaseRepository'
import type { FuelPurchaseListQuery } from '../domain/validation/purchaseSchemas'

const PRODUCT_IDS: Record<string, string> = {
  petrol: 'product-petrol',
  diesel: 'product-diesel',
  hobc: 'product-hobc',
}

function matchesSearch(purchase: FuelPurchase, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term.length === 0) return true

  const haystack = [
    purchase.supplierName ?? '',
    purchase.invoiceReference ?? '',
    purchase.id.toString(),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(term)
}

export class InMemoryFuelPurchaseRepository
  extends InMemoryRepository<FuelPurchase, FuelPurchaseId>
  implements IFuelPurchaseRepository
{
  protected readonly entityType = 'FuelPurchase'

  async list(query: FuelPurchaseListQuery): Promise<Result<FuelPurchase[], AppError>> {
    let purchases = this.all()

    if (query.status) {
      purchases = purchases.filter((purchase) => purchase.status === query.status)
    }

    if (query.search) {
      purchases = purchases.filter((purchase) => matchesSearch(purchase, query.search!))
    }

    purchases.sort(
      (a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime(),
    )

    return ok(purchases)
  }

  async record(input: RecordFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    if (input.quantityMilliLitres <= 0) {
      return err(new ConflictError('INVALID_QUANTITY', 'Quantity must be greater than zero.'))
    }
    if (input.unitCostMinorPerLitre <= 0) {
      return err(new ConflictError('INVALID_RATE', 'Purchase rate must be greater than zero.'))
    }
    if (!isPurchasePaymentStatus(input.paymentStatus)) {
      return err(new ConflictError('INVALID_PAYMENT_STATUS', 'Invalid payment status.'))
    }
    if (input.paymentStatus === 'credit' && !input.supplierPartnerId) {
      return err(
        new ConflictError('SUPPLIER_REQUIRED', 'Supplier is required for credit purchases.'),
      )
    }
    if (!isFuelProductCode(input.productCode)) {
      return err(new ConflictError('INVALID_PRODUCT', 'Invalid fuel product.'))
    }

    const productId = PRODUCT_IDS[input.productCode]
    const totalCostMinor = FuelPurchase.computeTotal(
      input.quantityMilliLitres,
      input.unitCostMinorPerLitre,
    )
    if (totalCostMinor <= 0) {
      return err(new ConflictError('INVALID_TOTAL', 'Purchase total must be greater than zero.'))
    }

    const now = new Date()
    const id = FuelPurchaseId.create()
    const status = input.postImmediately ? 'posted' : 'draft'
    const batchId = input.postImmediately ? `batch-${crypto.randomUUID()}` : null

    const purchase = FuelPurchase.reconstitute({
      id,
      purchaseDate: new Date(input.purchaseDateIso),
      productId,
      productCode: input.productCode,
      supplierPartnerId: input.supplierPartnerId ?? null,
      supplierName: null,
      quantityMilliLitres: input.quantityMilliLitres,
      unitCostMinorPerLitre: input.unitCostMinorPerLitre,
      totalCostMinor,
      invoiceReference: FuelPurchase.trimOptionalText(input.invoiceReference),
      paymentStatus: input.paymentStatus,
      notes: FuelPurchase.trimOptionalText(input.notes),
      status,
      batchId,
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
    })

    await this.save(purchase)
    return ok(purchase)
  }

  async post(input: PostFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    const existing = await this.findById(FuelPurchaseId.fromPersisted(input.purchaseId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PURCHASE_VERSION_CONFLICT',
          'Purchase was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (!existing.value.canPost()) {
      return err(new ConflictError('INVALID_STATUS', 'Only draft purchases can be posted.'))
    }

    existing.value.markPosted(`batch-${crypto.randomUUID()}`)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  async void(input: VoidFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    const existing = await this.findById(FuelPurchaseId.fromPersisted(input.purchaseId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PURCHASE_VERSION_CONFLICT',
          'Purchase was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (!existing.value.canVoid()) {
      return err(new ConflictError('INVALID_STATUS', 'Only draft purchases can be voided.'))
    }

    existing.value.markVoid()
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  /** Test helper — expose DTO snapshot. */
  toDto(purchase: FuelPurchase) {
    return mapFuelPurchaseToDto(purchase)
  }
}

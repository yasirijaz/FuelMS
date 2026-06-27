import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import {
  FuelPurchase,
  FuelPurchaseId,
  litresToMilliLitres,
  recordFuelPurchaseInputSchema,
  fuelPurchaseListQuerySchema,
  purchaseVersionInputSchema,
  type RecordFuelPurchaseInput,
  type FuelPurchaseListQuery,
  type PurchaseVersionInput,
} from '../../domain'
import type { IFuelPurchaseRepository } from '../../domain/repositories/IFuelPurchaseRepository'

/** Default actor until authentication is introduced. */
export const PURCHASE_DEFAULT_ACTOR = 'owner'

export class ListPurchasesService {
  constructor(private readonly repository: IFuelPurchaseRepository) {}

  async execute(query: FuelPurchaseListQuery = {}): Promise<Result<FuelPurchase[], AppError>> {
    const parsed = fuelPurchaseListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid list query.'))
    }

    return this.repository.list(parsed.data)
  }
}

export class GetPurchaseService {
  constructor(private readonly repository: IFuelPurchaseRepository) {}

  async execute(purchaseId: string): Promise<Result<FuelPurchase, AppError>> {
    if (!purchaseId.trim()) {
      return err(new ValidationError('Purchase id is required.'))
    }

    return this.repository.findById(FuelPurchaseId.fromPersisted(purchaseId))
  }
}

export class RecordPurchaseService {
  constructor(private readonly repository: IFuelPurchaseRepository) {}

  async execute(
    input: RecordFuelPurchaseInput,
    recordedBy: string = PURCHASE_DEFAULT_ACTOR,
  ): Promise<Result<FuelPurchase, AppError>> {
    const parsed = recordFuelPurchaseInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid purchase input.'))
    }

    if (parsed.data.quantityLitres <= 0) {
      return err(new ValidationError('Quantity must be greater than zero.'))
    }
    if (parsed.data.unitCostRupees <= 0) {
      return err(new ValidationError('Purchase rate must be greater than zero.'))
    }
    if (parsed.data.paymentStatus === 'credit' && !parsed.data.supplierPartnerId) {
      return err(new ValidationError('Supplier is required for credit purchases.'))
    }

    const quantityMilliLitres = litresToMilliLitres(parsed.data.quantityLitres)
    const unitCostMinorPerLitre = rupeesToMinor(parsed.data.unitCostRupees)

    if (quantityMilliLitres <= 0) {
      return err(new ValidationError('Quantity must be greater than zero.'))
    }
    if (unitCostMinorPerLitre <= 0) {
      return err(new ValidationError('Purchase rate must be greater than zero.'))
    }

    return this.repository.record({
      purchaseDateIso: parsed.data.purchaseDateIso,
      productCode: parsed.data.productCode,
      supplierPartnerId: parsed.data.supplierPartnerId,
      quantityMilliLitres,
      unitCostMinorPerLitre,
      invoiceReference: parsed.data.invoiceReference,
      paymentStatus: parsed.data.paymentStatus,
      notes: parsed.data.notes,
      postImmediately: parsed.data.postImmediately,
      recordedBy,
    })
  }
}

export class PostPurchaseService {
  constructor(private readonly repository: IFuelPurchaseRepository) {}

  async execute(input: PurchaseVersionInput): Promise<Result<FuelPurchase, AppError>> {
    const parsed = purchaseVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid post input.'))
    }

    const existing = await this.repository.findById(
      FuelPurchaseId.fromPersisted(parsed.data.purchaseId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canPost()) {
      return err(new ValidationError('Only draft purchases can be posted.'))
    }

    return this.repository.post(parsed.data)
  }
}

export class VoidPurchaseService {
  constructor(private readonly repository: IFuelPurchaseRepository) {}

  async execute(input: PurchaseVersionInput): Promise<Result<FuelPurchase, AppError>> {
    const parsed = purchaseVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid void input.'))
    }

    const existing = await this.repository.findById(
      FuelPurchaseId.fromPersisted(parsed.data.purchaseId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canVoid()) {
      return err(new ValidationError('Only draft purchases can be voided.'))
    }

    return this.repository.void(parsed.data)
  }
}

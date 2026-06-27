import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import {
  FuelSale,
  FuelSaleId,
  litresToMilliLitres,
  recordFuelSaleInputSchema,
  fuelSaleListQuerySchema,
  saleVersionInputSchema,
  type RecordFuelSaleInput,
  type FuelSaleListQuery,
  type SaleVersionInput,
} from '../../domain'
import type { IFuelSaleRepository } from '../../domain/repositories/IFuelSaleRepository'
import type { ProductStockDto } from '../../domain/dtos/SaleDtos'

/** Default actor until authentication is introduced. */
export const SALE_DEFAULT_ACTOR = 'owner'

export class ListSalesService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(query: FuelSaleListQuery = {}): Promise<Result<FuelSale[], AppError>> {
    const parsed = fuelSaleListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid list query.'))
    }

    return this.repository.list(parsed.data)
  }
}

export class GetSaleService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(saleId: string): Promise<Result<FuelSale, AppError>> {
    if (!saleId.trim()) {
      return err(new ValidationError('Sale id is required.'))
    }

    return this.repository.findById(FuelSaleId.fromPersisted(saleId))
  }
}

export class GetAvailableStockService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(productCode: string): Promise<Result<ProductStockDto, AppError>> {
    if (!productCode.trim()) {
      return err(new ValidationError('Product code is required.'))
    }

    return this.repository.getAvailableStock(productCode)
  }
}

export class RecordSaleService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(
    input: RecordFuelSaleInput,
    recordedBy: string = SALE_DEFAULT_ACTOR,
  ): Promise<Result<FuelSale, AppError>> {
    const parsed = recordFuelSaleInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid sale input.'))
    }

    if (parsed.data.quantityLitres <= 0) {
      return err(new ValidationError('Quantity must be greater than zero.'))
    }
    if (parsed.data.unitPriceRupees <= 0) {
      return err(new ValidationError('Selling price must be greater than zero.'))
    }
    if (parsed.data.paymentMethod === 'credit' && !parsed.data.customerPartnerId) {
      return err(new ValidationError('Customer is required for credit sales.'))
    }

    const quantityMilliLitres = litresToMilliLitres(parsed.data.quantityLitres)
    const unitPriceMinorPerLitre = rupeesToMinor(parsed.data.unitPriceRupees)

    if (quantityMilliLitres <= 0) {
      return err(new ValidationError('Quantity must be greater than zero.'))
    }
    if (unitPriceMinorPerLitre <= 0) {
      return err(new ValidationError('Selling price must be greater than zero.'))
    }

    return this.repository.record({
      saleDateIso: parsed.data.saleDateIso,
      productCode: parsed.data.productCode,
      customerPartnerId: parsed.data.customerPartnerId,
      quantityMilliLitres,
      unitPriceMinorPerLitre,
      fuelPriceRecordId: parsed.data.fuelPriceRecordId,
      paymentMethod: parsed.data.paymentMethod,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      postImmediately: parsed.data.postImmediately,
      recordedBy,
    })
  }
}

export class PostSaleService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(input: SaleVersionInput): Promise<Result<FuelSale, AppError>> {
    const parsed = saleVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid post input.'))
    }

    const existing = await this.repository.findById(
      FuelSaleId.fromPersisted(parsed.data.saleId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canPost()) {
      return err(new ValidationError('Only draft sales can be posted.'))
    }

    return this.repository.post(parsed.data)
  }
}

export class VoidSaleService {
  constructor(private readonly repository: IFuelSaleRepository) {}

  async execute(input: SaleVersionInput): Promise<Result<FuelSale, AppError>> {
    const parsed = saleVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid void input.'))
    }

    const existing = await this.repository.findById(
      FuelSaleId.fromPersisted(parsed.data.saleId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canVoid()) {
      return err(new ValidationError('Only draft sales can be voided.'))
    }

    return this.repository.void(parsed.data)
  }
}

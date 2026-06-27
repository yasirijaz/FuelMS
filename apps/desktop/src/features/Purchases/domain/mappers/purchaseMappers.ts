import { FuelPurchaseId } from '../ids/FuelPurchaseId'
import { isPurchasePaymentStatus } from '../valueObjects/PurchasePaymentStatus'
import { isPurchaseStatus } from '../valueObjects/PurchaseStatus'
import { FuelPurchase } from '../entities/FuelPurchase'
import type { FuelPurchaseDto, RecordFuelPurchaseInputDto } from '../dtos/PurchaseDtos'

export function mapFuelPurchaseDtoToDomain(dto: FuelPurchaseDto): FuelPurchase {
  if (!isPurchasePaymentStatus(dto.paymentStatus)) {
    throw new Error(`Invalid persisted purchase payment status: ${dto.paymentStatus}`)
  }
  if (!isPurchaseStatus(dto.status)) {
    throw new Error(`Invalid persisted purchase status: ${dto.status}`)
  }

  return FuelPurchase.reconstitute({
    id: FuelPurchaseId.fromPersisted(dto.id),
    purchaseDate: new Date(dto.purchaseDateIso),
    productId: dto.productId,
    productCode: dto.productCode,
    supplierPartnerId: dto.supplierPartnerId,
    supplierName: dto.supplierName,
    quantityMilliLitres: dto.quantityMilliLitres,
    unitCostMinorPerLitre: dto.unitCostMinorPerLitre,
    totalCostMinor: dto.totalCostMinor,
    invoiceReference: dto.invoiceReference,
    paymentStatus: dto.paymentStatus,
    notes: dto.notes,
    status: dto.status,
    batchId: dto.batchId,
    recordedBy: dto.recordedBy,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  })
}

export function mapFuelPurchaseToDto(purchase: FuelPurchase): FuelPurchaseDto {
  return {
    id: purchase.id.toString(),
    purchaseDateIso: purchase.purchaseDate.toISOString(),
    productId: purchase.productId,
    productCode: purchase.productCode,
    supplierPartnerId: purchase.supplierPartnerId,
    supplierName: purchase.supplierName,
    quantityMilliLitres: purchase.quantityMilliLitres,
    unitCostMinorPerLitre: purchase.unitCostMinorPerLitre,
    totalCostMinor: purchase.totalCostMinor,
    invoiceReference: purchase.invoiceReference,
    paymentStatus: purchase.paymentStatus,
    notes: purchase.notes,
    status: purchase.status,
    batchId: purchase.batchId,
    recordedBy: purchase.recordedBy,
    createdAtIso: purchase.createdAt.toISOString(),
    updatedAtIso: purchase.updatedAt.toISOString(),
    version: purchase.version,
  }
}

export function mapRecordInputToDto(
  input: RecordFuelPurchaseInputDto,
): RecordFuelPurchaseInputDto {
  return {
    purchaseDateIso: input.purchaseDateIso,
    productCode: input.productCode,
    supplierPartnerId: input.supplierPartnerId,
    quantityMilliLitres: input.quantityMilliLitres,
    unitCostMinorPerLitre: input.unitCostMinorPerLitre,
    invoiceReference: input.invoiceReference,
    paymentStatus: input.paymentStatus,
    notes: input.notes,
    postImmediately: input.postImmediately,
    recordedBy: input.recordedBy,
  }
}

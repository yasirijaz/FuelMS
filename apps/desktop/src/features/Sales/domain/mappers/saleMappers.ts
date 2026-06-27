import { FuelSaleId } from '../ids/FuelSaleId'
import { isSalePaymentMethod } from '../valueObjects/SalePaymentMethod'
import { isSaleStatus } from '../valueObjects/SaleStatus'
import { FuelSale } from '../entities/FuelSale'
import type { FuelSaleDto, RecordFuelSaleInputDto } from '../dtos/SaleDtos'

export function mapFuelSaleDtoToDomain(dto: FuelSaleDto): FuelSale {
  if (!isSalePaymentMethod(dto.paymentMethod)) {
    throw new Error(`Invalid persisted sale payment method: ${dto.paymentMethod}`)
  }
  if (!isSaleStatus(dto.status)) {
    throw new Error(`Invalid persisted sale status: ${dto.status}`)
  }

  return FuelSale.reconstitute({
    id: FuelSaleId.fromPersisted(dto.id),
    saleDate: new Date(dto.saleDateIso),
    productId: dto.productId,
    productCode: dto.productCode,
    customerPartnerId: dto.customerPartnerId,
    customerName: dto.customerName,
    quantityMilliLitres: dto.quantityMilliLitres,
    unitPriceMinorPerLitre: dto.unitPriceMinorPerLitre,
    fuelPriceRecordId: dto.fuelPriceRecordId,
    totalRevenueMinor: dto.totalRevenueMinor,
    totalCogsMinor: dto.totalCogsMinor,
    paymentMethod: dto.paymentMethod,
    reference: dto.reference,
    notes: dto.notes,
    status: dto.status,
    recordedBy: dto.recordedBy,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  })
}

export function mapFuelSaleToDto(sale: FuelSale): FuelSaleDto {
  return {
    id: sale.id.toString(),
    saleDateIso: sale.saleDate.toISOString(),
    productId: sale.productId,
    productCode: sale.productCode,
    customerPartnerId: sale.customerPartnerId,
    customerName: sale.customerName,
    quantityMilliLitres: sale.quantityMilliLitres,
    unitPriceMinorPerLitre: sale.unitPriceMinorPerLitre,
    fuelPriceRecordId: sale.fuelPriceRecordId,
    totalRevenueMinor: sale.totalRevenueMinor,
    totalCogsMinor: sale.totalCogsMinor,
    paymentMethod: sale.paymentMethod,
    reference: sale.reference,
    notes: sale.notes,
    status: sale.status,
    recordedBy: sale.recordedBy,
    createdAtIso: sale.createdAt.toISOString(),
    updatedAtIso: sale.updatedAt.toISOString(),
    version: sale.version,
  }
}

export function mapRecordInputToDto(input: RecordFuelSaleInputDto): RecordFuelSaleInputDto {
  return {
    saleDateIso: input.saleDateIso,
    productCode: input.productCode,
    customerPartnerId: input.customerPartnerId,
    quantityMilliLitres: input.quantityMilliLitres,
    unitPriceMinorPerLitre: input.unitPriceMinorPerLitre,
    fuelPriceRecordId: input.fuelPriceRecordId,
    paymentMethod: input.paymentMethod,
    reference: input.reference,
    notes: input.notes,
    postImmediately: input.postImmediately,
    recordedBy: input.recordedBy,
  }
}

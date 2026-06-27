import type { FuelProduct } from '../entities/FuelProduct'
import { FuelPriceRecord } from '../entities/FuelPriceRecord'
import { FuelProductId } from '../ids/FuelProductId'
import { FuelPriceRecordId } from '../ids/FuelPriceRecordId'
import { FuelPriceChangeBatchId } from '../ids/FuelPriceChangeBatchId'
import { PricePerLitre } from '../valueObjects/PricePerLitre'
import { EffectiveDateTime } from '../valueObjects/EffectiveDateTime'
import { isFuelPriceStatus } from '../valueObjects/FuelPriceStatus'
import type { FuelProductDto, FuelPriceRecordDto } from '../dtos/FuelPriceDtos'
import { parseFuelProductCode } from '../valueObjects/FuelProductCode'
import { unwrap } from '@fuelms/core'

export function mapProductDtoToDomain(dto: FuelProductDto): FuelProduct {
  const codeResult = parseFuelProductCode(dto.code)
  if (!codeResult.ok) {
    throw new Error(`Invalid product code in database: ${dto.code}`)
  }
  return {
    id: FuelProductId.fromPersisted(dto.id),
    code: codeResult.value,
    name: dto.name,
    unit: dto.unit,
    displayOrder: dto.displayOrder,
  }
}

export function mapPriceRecordDtoToDomain(dto: FuelPriceRecordDto): FuelPriceRecord {
  const codeResult = parseFuelProductCode(dto.productCode)
  if (!codeResult.ok) {
    throw new Error(`Invalid product code on price record: ${dto.productCode}`)
  }
  if (!isFuelPriceStatus(dto.status)) {
    throw new Error(`Invalid price status in database: ${dto.status}`)
  }

  return FuelPriceRecord.restore({
    id: FuelPriceRecordId.fromPersisted(dto.id),
    productId: FuelProductId.fromPersisted(dto.productId),
    productCode: codeResult.value,
    pricePerLitre: unwrap(PricePerLitre.fromMinor(dto.pricePerLitreMinor)),
    effectiveFrom: unwrap(EffectiveDateTime.fromIso(dto.effectiveFromIso)),
    effectiveTo: dto.effectiveToIso
      ? unwrap(EffectiveDateTime.fromIso(dto.effectiveToIso))
      : null,
    status: dto.status,
    reason: dto.reason,
    reference: dto.reference,
    recordedBy: dto.recordedBy,
    batchId: dto.batchId ? FuelPriceChangeBatchId.fromPersisted(dto.batchId) : null,
    supersededById: dto.supersededById
      ? FuelPriceRecordId.fromPersisted(dto.supersededById)
      : null,
    isLocked: dto.isLocked,
    version: dto.version,
  })
}

export function mapPriceRecordToDto(record: FuelPriceRecord): FuelPriceRecordDto {
  return {
    id: record.id.toString(),
    productId: record.productId.toString(),
    productCode: record.productCode,
    pricePerLitreMinor: record.pricePerLitre.minorPerLitre,
    effectiveFromIso: record.effectiveFrom.iso,
    effectiveToIso: record.effectiveTo?.iso ?? null,
    status: record.status,
    reason: record.reason,
    reference: record.reference,
    recordedBy: record.recordedBy,
    batchId: record.batchId?.toString() ?? null,
    supersededById: record.supersededById?.toString() ?? null,
    isLocked: record.isLocked,
    version: record.version,
  }
}

export function mapProductToDto(product: FuelProduct): FuelProductDto {
  return {
    id: product.id.toString(),
    code: product.code,
    name: product.name,
    unit: product.unit,
    displayOrder: product.displayOrder,
  }
}

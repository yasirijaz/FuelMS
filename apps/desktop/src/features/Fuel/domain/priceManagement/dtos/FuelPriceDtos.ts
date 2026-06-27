/** Serializable DTO exchanged with Tauri commands — mirrors SQLite columns. */
export interface FuelProductDto {
  id: string
  code: string
  name: string
  unit: string
  displayOrder: number
}

export interface FuelPriceRecordDto {
  id: string
  productId: string
  productCode: string
  pricePerLitreMinor: number
  effectiveFromIso: string
  effectiveToIso: string | null
  status: string
  reason: string | null
  reference: string | null
  recordedBy: string
  batchId: string | null
  supersededById: string | null
  isLocked: boolean
  version: number
}

export interface SaveFuelPriceRecordRequest {
  record: FuelPriceRecordDto
}

export interface SaveFuelPriceRecordResponse {
  record: FuelPriceRecordDto
  supersededRecord: FuelPriceRecordDto | null
}

export interface PriceHistoryQueryDto {
  productId?: string
  fromIso?: string
  toIso?: string
  limit?: number
}

export interface FuelPriceCommandError {
  code: string
  message: string
  kind: string
}

export interface FuelPriceCommandResult<T> {
  ok: boolean
  value?: T
  error?: FuelPriceCommandError
}

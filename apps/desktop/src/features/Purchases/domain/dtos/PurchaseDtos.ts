export interface FuelPurchaseDto {
  id: string
  purchaseDateIso: string
  productId: string
  productCode: string
  supplierPartnerId: string | null
  supplierName: string | null
  quantityMilliLitres: number
  unitCostMinorPerLitre: number
  totalCostMinor: number
  invoiceReference: string | null
  paymentStatus: string
  notes: string | null
  status: string
  batchId: string | null
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export interface FuelPurchaseListQueryDto {
  search?: string
  status?: string
}

export interface RecordFuelPurchaseInputDto {
  purchaseDateIso: string
  productCode: string
  supplierPartnerId?: string
  quantityMilliLitres: number
  unitCostMinorPerLitre: number
  invoiceReference?: string
  paymentStatus: string
  notes?: string
  postImmediately: boolean
  recordedBy: string
}

export interface PostFuelPurchaseInputDto {
  purchaseId: string
  version: number
}

export interface VoidFuelPurchaseInputDto {
  purchaseId: string
  version: number
}

export interface FuelPurchaseCommandError {
  code: string
  message: string
  kind: string
}

export interface FuelPurchaseCommandResult<T> {
  ok: boolean
  value?: T
  error?: FuelPurchaseCommandError
}

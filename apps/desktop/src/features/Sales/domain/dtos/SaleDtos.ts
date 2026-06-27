export interface FuelSaleDto {
  id: string
  saleDateIso: string
  productId: string
  productCode: string
  customerPartnerId: string | null
  customerName: string | null
  quantityMilliLitres: number
  unitPriceMinorPerLitre: number
  fuelPriceRecordId: string
  totalRevenueMinor: number
  totalCogsMinor: number
  paymentMethod: string
  reference: string | null
  notes: string | null
  status: string
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export interface FuelSaleListQueryDto {
  search?: string
  status?: string
  fromDateIso?: string
  toDateIso?: string
}

export interface RecordFuelSaleInputDto {
  saleDateIso: string
  productCode: string
  customerPartnerId?: string
  quantityMilliLitres: number
  unitPriceMinorPerLitre: number
  fuelPriceRecordId: string
  paymentMethod: string
  reference?: string
  notes?: string
  postImmediately: boolean
  recordedBy: string
}

export interface PostFuelSaleInputDto {
  saleId: string
  version: number
}

export interface VoidFuelSaleInputDto {
  saleId: string
  version: number
}

export interface ProductStockDto {
  productCode: string
  availableMilliLitres: number
}

export interface FuelSaleCommandError {
  code: string
  message: string
  kind: string
}

export interface FuelSaleCommandResult<T> {
  ok: boolean
  value?: T
  error?: FuelSaleCommandError
}

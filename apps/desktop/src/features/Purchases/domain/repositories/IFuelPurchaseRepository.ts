import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { FuelPurchase } from '../entities/FuelPurchase'
import type { FuelPurchaseId } from '../ids/FuelPurchaseId'
import type {
  PostFuelPurchaseInputDto,
  RecordFuelPurchaseInputDto,
  VoidFuelPurchaseInputDto,
} from '../dtos/PurchaseDtos'
import type { FuelPurchaseListQuery } from '../validation/purchaseSchemas'

export interface IFuelPurchaseRepository {
  list(query: FuelPurchaseListQuery): Promise<Result<FuelPurchase[], AppError>>
  findById(id: FuelPurchaseId): Promise<Result<FuelPurchase, NotFoundError>>
  record(input: RecordFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>>
  post(input: PostFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>>
  void(input: VoidFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>>
}

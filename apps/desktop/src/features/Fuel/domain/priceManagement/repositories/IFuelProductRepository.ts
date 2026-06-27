import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { FuelProduct } from '../entities/FuelProduct'
import type { FuelProductCode } from '../valueObjects/FuelProductCode'
import type { FuelProductId } from '../ids/FuelProductId'

export interface IFuelProductRepository {
  findAllActive(): Promise<Result<FuelProduct[], AppError>>
  findByCode(code: FuelProductCode): Promise<Result<FuelProduct, NotFoundError>>
  findById(id: FuelProductId): Promise<Result<FuelProduct, NotFoundError>>
}

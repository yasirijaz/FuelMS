import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { FuelSale } from '../entities/FuelSale'
import type { FuelSaleId } from '../ids/FuelSaleId'
import type {
  PostFuelSaleInputDto,
  ProductStockDto,
  RecordFuelSaleInputDto,
  VoidFuelSaleInputDto,
} from '../dtos/SaleDtos'
import type { FuelSaleListQuery } from '../validation/saleSchemas'

export interface IFuelSaleRepository {
  list(query: FuelSaleListQuery): Promise<Result<FuelSale[], AppError>>
  findById(id: FuelSaleId): Promise<Result<FuelSale, NotFoundError>>
  getAvailableStock(productCode: string): Promise<Result<ProductStockDto, AppError>>
  record(input: RecordFuelSaleInputDto): Promise<Result<FuelSale, AppError>>
  post(input: PostFuelSaleInputDto): Promise<Result<FuelSale, AppError>>
  void(input: VoidFuelSaleInputDto): Promise<Result<FuelSale, AppError>>
}

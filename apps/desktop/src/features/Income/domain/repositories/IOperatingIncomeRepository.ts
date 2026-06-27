import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { OperatingIncome, OperatingIncomeId } from '../entities/OperatingIncome'
import type {
  OperatingIncomeListQuery,
  RecordOperatingIncomeInput,
  VoidOperatingIncomeInput,
} from '../validation/incomeSchemas'

export interface IOperatingIncomeRepository {
  list(query: OperatingIncomeListQuery): Promise<Result<OperatingIncome[], AppError>>
  findById(id: OperatingIncomeId): Promise<Result<OperatingIncome, NotFoundError>>
  record(input: RecordOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>>
  void(input: VoidOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>>
}

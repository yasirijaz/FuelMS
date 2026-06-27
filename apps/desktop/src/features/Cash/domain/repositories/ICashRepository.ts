import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { CashAccount, CashAccountId, CashTransfer } from '../entities/CashAccount'
import type {
  CashAccountVersionInput,
  CashTransferListQuery,
  CreateCashAccountInput,
  RecordCashTransferInput,
  UpdateCashAccountInput,
} from '../validation/cashSchemas'

export interface ICashRepository {
  listAccounts(activeOnly?: boolean): Promise<Result<CashAccount[], AppError>>
  findAccountById(id: CashAccountId): Promise<Result<CashAccount, NotFoundError>>
  createAccount(input: CreateCashAccountInput): Promise<Result<CashAccount, AppError>>
  updateAccount(input: UpdateCashAccountInput): Promise<Result<CashAccount, AppError>>
  activateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>>
  deactivateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>>
  listTransfers(query: CashTransferListQuery): Promise<Result<CashTransfer[], AppError>>
  recordTransfer(input: RecordCashTransferInput): Promise<Result<CashTransfer, AppError>>
}

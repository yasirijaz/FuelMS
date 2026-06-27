import { cashRepository, cashRepositoryRuntime } from '../infrastructure/cashRepositories'
import {
  CreateCashAccountService,
  ListCashAccountsService,
  ListCashTransfersService,
  RecordCashTransferService,
  UpdateCashAccountService,
} from './services/CashServices'
import type { CashTransferListQuery } from '../domain'

export const listCashAccountsService = new ListCashAccountsService(cashRepository)
export const createCashAccountService = new CreateCashAccountService(cashRepository)
export const updateCashAccountService = new UpdateCashAccountService(cashRepository)
export const listCashTransfersService = new ListCashTransfersService(cashRepository)
export const recordCashTransferService = new RecordCashTransferService(cashRepository)

export const cashQueryKeys = {
  all: ['cash'] as const,
  accounts: () => [...cashQueryKeys.all, 'accounts'] as const,
  accountList: (activeOnly: boolean) => [...cashQueryKeys.accounts(), { activeOnly }] as const,
  transfers: () => [...cashQueryKeys.all, 'transfers'] as const,
  transferList: (query: CashTransferListQuery) => [...cashQueryKeys.transfers(), query] as const,
}

export { cashRepositoryRuntime }

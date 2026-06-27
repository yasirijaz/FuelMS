import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { ICashRepository } from '../domain/repositories/ICashRepository'
import type { CashAccount, CashAccountId, CashTransfer } from '../domain/entities/CashAccount'
import type {
  CashAccountDto,
  CashAccountVersionInputDto,
  CashCommandResult,
  CashTransferDto,
  CashTransferListQueryDto,
  RecordCashTransferInputDto,
  UpdateCashAccountInputDto,
} from '../domain/dtos/CashDtos'
import type {
  CashAccountVersionInput,
  CashTransferListQuery,
  CreateCashAccountInput,
  RecordCashTransferInput,
  UpdateCashAccountInput,
} from '../domain/validation/cashSchemas'
import {
  mapCashAccountDtoToDomain,
  mapCashTransferDtoToDomain,
  mapCreateAccountInputToDto,
  mapRecordTransferInputToDto,
  mapUpdateAccountInputToDto,
} from '../domain/mappers/cashMappers'
import { CashAccountId as CashAccountIdFactory } from '../domain/entities/CashAccount'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('CashAccount', e.message)
  if (e.kind === 'conflict') return new Conflict(e.code, e.message)
  return new InfrastructureError(e.code, e.message)
}

async function loadInvoke() {
  if (!env.IS_TAURI) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke
}

async function invokeResult<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, AppError>> {
  try {
    const invoke = await loadInvoke()
    if (!invoke) {
      return err(
        new InfrastructureError(
          'TAURI_UNAVAILABLE',
          'Tauri backend is not available. Run the desktop app with: pnpm tauri dev',
        ),
      )
    }

    const response = await invoke<CashCommandResult<T>>(command, args)
    if (response.ok && response.value !== undefined) return ok(response.value)
    if (response.error) return err(mapCommandError(response.error))
    return err(new InfrastructureError('UNKNOWN', 'Command returned no value or error.'))
  } catch (caught) {
    return err(
      new InfrastructureError(
        'TAURI_INVOKE_FAILED',
        caught instanceof Error ? caught.message : String(caught),
        caught,
      ),
    )
  }
}

export class TauriCashRepository implements ICashRepository {
  async listAccounts(activeOnly = true): Promise<Result<CashAccount[], AppError>> {
    const result = await invokeResult<CashAccountDto[]>('cash_account_list', { activeOnly })
    if (!result.ok) return result
    return ok(result.value.map(mapCashAccountDtoToDomain))
  }

  async findAccountById(id: CashAccountId): Promise<Result<CashAccount, NotFoundError>> {
    const result = await invokeResult<CashAccountDto>('cash_account_get_by_id', {
      accountId: CashAccountIdFactory.toString(id),
    })
    if (!result.ok) return result as Result<CashAccount, NotFoundError>
    return ok(mapCashAccountDtoToDomain(result.value))
  }

  async createAccount(input: CreateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const result = await invokeResult<CashAccountDto>('cash_account_create', {
      input: mapCreateAccountInputToDto(input),
    })
    if (!result.ok) return result
    return ok(mapCashAccountDtoToDomain(result.value))
  }

  async updateAccount(input: UpdateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const payload: UpdateCashAccountInputDto = mapUpdateAccountInputToDto(input)
    const result = await invokeResult<CashAccountDto>('cash_account_update', { input: payload })
    if (!result.ok) return result
    return ok(mapCashAccountDtoToDomain(result.value))
  }

  async activateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    const payload: CashAccountVersionInputDto = {
      accountId: input.accountId,
      version: input.version,
    }
    const result = await invokeResult<CashAccountDto>('cash_account_activate', { input: payload })
    if (!result.ok) return result
    return ok(mapCashAccountDtoToDomain(result.value))
  }

  async deactivateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    const payload: CashAccountVersionInputDto = {
      accountId: input.accountId,
      version: input.version,
    }
    const result = await invokeResult<CashAccountDto>('cash_account_deactivate', { input: payload })
    if (!result.ok) return result
    return ok(mapCashAccountDtoToDomain(result.value))
  }

  async listTransfers(query: CashTransferListQuery): Promise<Result<CashTransfer[], AppError>> {
    const payload: CashTransferListQueryDto = {
      accountId: query.accountId,
      limit: query.limit,
    }
    const result = await invokeResult<CashTransferDto[]>('cash_transfer_list', { query: payload })
    if (!result.ok) return result
    return ok(result.value.map(mapCashTransferDtoToDomain))
  }

  async recordTransfer(input: RecordCashTransferInput): Promise<Result<CashTransfer, AppError>> {
    const payload: RecordCashTransferInputDto = mapRecordTransferInputToDto(input, 'owner')
    const result = await invokeResult<CashTransferDto>('cash_transfer_record', { input: payload })
    if (!result.ok) return result
    return ok(mapCashTransferDtoToDomain(result.value))
  }
}

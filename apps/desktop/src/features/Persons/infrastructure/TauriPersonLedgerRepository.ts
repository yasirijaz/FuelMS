import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IPersonLedgerRepository } from '../domain/repositories/IPersonLedgerRepository'
import type { PersonLedgerBalance } from '../domain/entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../domain/entities/PersonLedgerEntry'
import type {
  PersonLedgerBalanceListQueryDto,
  PersonLedgerCommandResult,
  PersonLedgerEntryDto,
  PersonLedgerEntryListQueryDto,
  PersonLedgerBalanceDto,
  RecordPersonBorrowInputDto,
  RecordPersonCollectLoanInputDto,
  RecordPersonLendInputDto,
  RecordPersonRepayBorrowedInputDto,
} from '../domain/dtos/PersonLedgerDtos'
import type {
  PersonLedgerBalanceListQuery,
  PersonLedgerEntryListQuery,
  RecordPersonBorrowInput,
  RecordPersonCollectLoanInput,
  RecordPersonLendInput,
  RecordPersonRepayBorrowedInput,
} from '../domain/validation/personLedgerSchemas'
import {
  mapPersonLedgerBalanceDtoToDomain,
  mapPersonLedgerEntryDtoToDomain,
  mapRecordBorrowInputToDto,
  mapRecordCollectLoanInputToDto,
  mapRecordLendInputToDto,
  mapRecordRepayBorrowedInputToDto,
} from '../domain/mappers/personLedgerMappers'
const DEFAULT_ACTOR = 'owner'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('PersonLedger', e.message)
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
    const response = await invoke<PersonLedgerCommandResult<T>>(command, args)
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

export class TauriPersonLedgerRepository implements IPersonLedgerRepository {
  async listBalances(
    query: PersonLedgerBalanceListQuery,
  ): Promise<Result<PersonLedgerBalance[], AppError>> {
    const payload: PersonLedgerBalanceListQueryDto = {
      search: query.search,
      roleCode: query.roleCode,
      nonZeroOnly: query.nonZeroOnly,
    }
    const result = await invokeResult<PersonLedgerBalanceDto[]>('person_ledger_list_balances', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapPersonLedgerBalanceDtoToDomain))
  }

  async listEntries(
    query: PersonLedgerEntryListQuery,
  ): Promise<Result<PersonLedgerEntry[], AppError>> {
    const payload: PersonLedgerEntryListQueryDto = {
      partnerId: query.partnerId,
      limit: query.limit,
    }
    const result = await invokeResult<PersonLedgerEntryDto[]>('person_ledger_list_entries', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapPersonLedgerEntryDtoToDomain))
  }

  async recordBorrow(input: RecordPersonBorrowInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const payload: RecordPersonBorrowInputDto = mapRecordBorrowInputToDto(
      input,
      DEFAULT_ACTOR,
    )
    const result = await invokeResult<PersonLedgerEntryDto>('person_ledger_record_borrow', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapPersonLedgerEntryDtoToDomain(result.value))
  }

  async recordRepayBorrowed(
    input: RecordPersonRepayBorrowedInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const payload: RecordPersonRepayBorrowedInputDto = mapRecordRepayBorrowedInputToDto(
      input,
      DEFAULT_ACTOR,
    )
    const result = await invokeResult<PersonLedgerEntryDto>('person_ledger_record_repay_borrowed', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapPersonLedgerEntryDtoToDomain(result.value))
  }

  async recordLend(input: RecordPersonLendInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const payload: RecordPersonLendInputDto = mapRecordLendInputToDto(
      input,
      DEFAULT_ACTOR,
    )
    const result = await invokeResult<PersonLedgerEntryDto>('person_ledger_record_lend', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapPersonLedgerEntryDtoToDomain(result.value))
  }

  async recordCollectLoan(
    input: RecordPersonCollectLoanInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const payload: RecordPersonCollectLoanInputDto = mapRecordCollectLoanInputToDto(
      input,
      DEFAULT_ACTOR,
    )
    const result = await invokeResult<PersonLedgerEntryDto>('person_ledger_record_collect_loan', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapPersonLedgerEntryDtoToDomain(result.value))
  }
}

import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IAccountingRepository } from '../domain/repositories/IAccountingRepository'
import type { AccountingPeriod } from '../domain/entities/AccountingPeriod'
import { JournalEntryId } from '../domain/entities/JournalEntry'
import type { JournalEntry } from '../domain/entities/JournalEntry'
import { LedgerAccountId } from '../domain/entities/LedgerAccount'
import type { LedgerAccount } from '../domain/entities/LedgerAccount'
import type {
  AccountingCommandResult,
  AccountingPeriodDto,
  AccountingPeriodVersionInputDto,
  JournalEntryDto,
  JournalListQueryDto,
  LedgerAccountDto,
} from '../domain/dtos/AccountingDtos'
import type {
  AccountingPeriodVersionInput,
  JournalListQuery,
} from '../domain/validation/accountingSchemas'
import {
  mapAccountingPeriodDtoToDomain,
  mapJournalEntryDtoToDomain,
  mapLedgerAccountDtoToDomain,
  mapPeriodVersionInputToDto,
} from '../domain/mappers/accountingMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('Accounting', e.message)
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
    const response = await invoke<AccountingCommandResult<T>>(command, args)
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

export class TauriAccountingRepository implements IAccountingRepository {
  async listLedgerAccounts(activeOnly = true): Promise<Result<LedgerAccount[], AppError>> {
    const result = await invokeResult<LedgerAccountDto[]>('accounting_ledger_account_list', {
      activeOnly,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapLedgerAccountDtoToDomain))
  }

  async findLedgerAccountById(
    id: LedgerAccountId,
  ): Promise<Result<LedgerAccount, NotFoundError>> {
    const result = await invokeResult<LedgerAccountDto>('accounting_ledger_account_get_by_id', {
      accountId: LedgerAccountId.toString(id),
    })
    if (!result.ok) return result as Result<LedgerAccount, NotFoundError>
    return ok(mapLedgerAccountDtoToDomain(result.value))
  }

  async listJournalEntries(query: JournalListQuery): Promise<Result<JournalEntry[], AppError>> {
    const payload: JournalListQueryDto = {
      search: query.search,
      postingStatus: query.postingStatus,
      fromDateIso: query.fromDateIso,
      toDateIso: query.toDateIso,
      limit: query.limit,
    }
    const result = await invokeResult<JournalEntryDto[]>('accounting_journal_list', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapJournalEntryDtoToDomain))
  }

  async findJournalEntryById(
    id: JournalEntryId,
  ): Promise<Result<JournalEntry, NotFoundError>> {
    const result = await invokeResult<JournalEntryDto>('accounting_journal_get_by_id', {
      journalId: JournalEntryId.toString(id),
    })
    if (!result.ok) return result as Result<JournalEntry, NotFoundError>
    return ok(mapJournalEntryDtoToDomain(result.value))
  }

  async listAccountingPeriods(): Promise<Result<AccountingPeriod[], AppError>> {
    const result = await invokeResult<AccountingPeriodDto[]>('accounting_period_list')
    if (!result.ok) return result
    return ok(result.value.map(mapAccountingPeriodDtoToDomain))
  }

  async getCurrentAccountingPeriod(): Promise<Result<AccountingPeriod, AppError>> {
    const result = await invokeResult<AccountingPeriodDto>('accounting_period_get_current')
    if (!result.ok) return result
    return ok(mapAccountingPeriodDtoToDomain(result.value))
  }

  async closeAccountingPeriod(
    input: AccountingPeriodVersionInput,
  ): Promise<Result<AccountingPeriod, AppError>> {
    const payload: AccountingPeriodVersionInputDto = mapPeriodVersionInputToDto(
      input.periodId,
      input.version,
      'owner',
    )
    const result = await invokeResult<AccountingPeriodDto>('accounting_period_close', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapAccountingPeriodDtoToDomain(result.value))
  }

  async reopenAccountingPeriod(
    input: AccountingPeriodVersionInput,
  ): Promise<Result<AccountingPeriod, AppError>> {
    const payload: AccountingPeriodVersionInputDto = mapPeriodVersionInputToDto(
      input.periodId,
      input.version,
      'owner',
    )
    const result = await invokeResult<AccountingPeriodDto>('accounting_period_reopen', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapAccountingPeriodDtoToDomain(result.value))
  }
}

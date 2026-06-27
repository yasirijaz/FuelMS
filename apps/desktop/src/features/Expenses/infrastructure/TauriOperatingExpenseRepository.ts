import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IOperatingExpenseRepository } from '../domain/repositories/IOperatingExpenseRepository'
import type { OperatingExpense, OperatingExpenseId } from '../domain/entities/OperatingExpense'
import type {
  ExpenseCommandResult,
  OperatingExpenseDto,
  OperatingExpenseListQueryDto,
  RecordOperatingExpenseInputDto,
  VoidOperatingExpenseInputDto,
} from '../domain/dtos/ExpenseDtos'
import type {
  OperatingExpenseListQuery,
  RecordOperatingExpenseInput,
  VoidOperatingExpenseInput,
} from '../domain/validation/expenseSchemas'
import {
  mapOperatingExpenseDtoToDomain,
  mapRecordExpenseInputToDto,
} from '../domain/mappers/expenseMappers'
import { OperatingExpenseId as OperatingExpenseIdFactory } from '../domain/entities/OperatingExpense'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('OperatingExpense', e.message)
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
    const response = await invoke<ExpenseCommandResult<T>>(command, args)
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

export class TauriOperatingExpenseRepository implements IOperatingExpenseRepository {
  async list(query: OperatingExpenseListQuery): Promise<Result<OperatingExpense[], AppError>> {
    const payload: OperatingExpenseListQueryDto = {
      search: query.search,
      status: query.status === 'all' ? undefined : query.status,
    }
    const result = await invokeResult<OperatingExpenseDto[]>('operating_expense_list', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapOperatingExpenseDtoToDomain))
  }

  async findById(id: OperatingExpenseId): Promise<Result<OperatingExpense, NotFoundError>> {
    const result = await invokeResult<OperatingExpenseDto>('operating_expense_get_by_id', {
      expenseId: OperatingExpenseIdFactory.toString(id),
    })
    if (!result.ok) return result as Result<OperatingExpense, NotFoundError>
    return ok(mapOperatingExpenseDtoToDomain(result.value))
  }

  async record(input: RecordOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    const payload: RecordOperatingExpenseInputDto = mapRecordExpenseInputToDto(input, 'owner')
    const result = await invokeResult<OperatingExpenseDto>('operating_expense_record', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapOperatingExpenseDtoToDomain(result.value))
  }

  async void(input: VoidOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    const payload: VoidOperatingExpenseInputDto = {
      expenseId: input.expenseId,
      version: input.version,
    }
    const result = await invokeResult<OperatingExpenseDto>('operating_expense_void', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapOperatingExpenseDtoToDomain(result.value))
  }
}

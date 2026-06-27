import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IOperatingIncomeRepository } from '../domain/repositories/IOperatingIncomeRepository'
import type { OperatingIncome, OperatingIncomeId } from '../domain/entities/OperatingIncome'
import type {
  IncomeCommandResult,
  OperatingIncomeDto,
  OperatingIncomeListQueryDto,
  RecordOperatingIncomeInputDto,
  VoidOperatingIncomeInputDto,
} from '../domain/dtos/IncomeDtos'
import type {
  OperatingIncomeListQuery,
  RecordOperatingIncomeInput,
  VoidOperatingIncomeInput,
} from '../domain/validation/incomeSchemas'
import {
  mapOperatingIncomeDtoToDomain,
  mapRecordIncomeInputToDto,
} from '../domain/mappers/incomeMappers'
import { OperatingIncomeId as OperatingIncomeIdFactory } from '../domain/entities/OperatingIncome'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('OperatingIncome', e.message)
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
    const response = await invoke<IncomeCommandResult<T>>(command, args)
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

export class TauriOperatingIncomeRepository implements IOperatingIncomeRepository {
  async list(query: OperatingIncomeListQuery): Promise<Result<OperatingIncome[], AppError>> {
    const payload: OperatingIncomeListQueryDto = {
      search: query.search,
      status: query.status === 'all' ? undefined : query.status,
    }
    const result = await invokeResult<OperatingIncomeDto[]>('operating_income_list', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapOperatingIncomeDtoToDomain))
  }

  async findById(id: OperatingIncomeId): Promise<Result<OperatingIncome, NotFoundError>> {
    const result = await invokeResult<OperatingIncomeDto>('operating_income_get_by_id', {
      incomeId: OperatingIncomeIdFactory.toString(id),
    })
    if (!result.ok) return result as Result<OperatingIncome, NotFoundError>
    return ok(mapOperatingIncomeDtoToDomain(result.value))
  }

  async record(input: RecordOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    const payload: RecordOperatingIncomeInputDto = mapRecordIncomeInputToDto(input, 'owner')
    const result = await invokeResult<OperatingIncomeDto>('operating_income_record', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapOperatingIncomeDtoToDomain(result.value))
  }

  async void(input: VoidOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    const payload: VoidOperatingIncomeInputDto = {
      incomeId: input.incomeId,
      version: input.version,
    }
    const result = await invokeResult<OperatingIncomeDto>('operating_income_void', {
      input: payload,
    })
    if (!result.ok) return result
    return ok(mapOperatingIncomeDtoToDomain(result.value))
  }
}

import { rupeesToMinor } from '@fuelms/shared'
import type { OperatingIncomeDto, RecordOperatingIncomeInputDto } from '../dtos/IncomeDtos'
import type { OperatingIncome } from '../entities/OperatingIncome'
import { OperatingIncomeId } from '../entities/OperatingIncome'
import { isIncomePaymentStatus } from '../valueObjects/IncomePaymentStatus'
import { isIncomeStatus } from '../valueObjects/IncomeStatus'
import type { IncomeCategory } from '../valueObjects/IncomeCategory'
import { INCOME_CATEGORIES } from '../valueObjects/IncomeCategory'
import type { RecordOperatingIncomeInput } from '../validation/incomeSchemas'

function assertCategory(code: string): IncomeCategory {
  if (!(INCOME_CATEGORIES as readonly string[]).includes(code)) {
    throw new Error(`Invalid income category: ${code}`)
  }
  return code as IncomeCategory
}

export function mapOperatingIncomeDtoToDomain(dto: OperatingIncomeDto): OperatingIncome {
  if (!isIncomePaymentStatus(dto.paymentStatus)) {
    throw new Error(`Invalid payment status: ${dto.paymentStatus}`)
  }
  if (!isIncomeStatus(dto.status)) {
    throw new Error(`Invalid income status: ${dto.status}`)
  }

  return {
    id: OperatingIncomeId.fromPersisted(dto.id),
    incomeDate: new Date(dto.incomeDateIso),
    categoryCode: assertCategory(dto.categoryCode),
    amountMinor: dto.amountMinor,
    paymentStatus: dto.paymentStatus,
    sourceName: dto.sourceName,
    cashAccountId: dto.cashAccountId ?? undefined,
    cashAccountName: dto.cashAccountName ?? undefined,
    reference: dto.reference ?? undefined,
    notes: dto.notes ?? undefined,
    status: dto.status,
    recordedBy: dto.recordedBy,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapRecordIncomeInputToDto(
  input: RecordOperatingIncomeInput,
  recordedBy: string,
): RecordOperatingIncomeInputDto {
  return {
    incomeDateIso: input.incomeDateIso,
    categoryCode: input.categoryCode,
    amountMinor: rupeesToMinor(input.amountRupees),
    paymentStatus: input.paymentStatus,
    sourceName: input.sourceName.trim(),
    cashAccountId: input.paymentStatus === 'received' ? input.cashAccountId : undefined,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    recordedBy,
  }
}

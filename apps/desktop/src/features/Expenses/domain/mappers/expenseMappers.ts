import { rupeesToMinor } from '@fuelms/shared'
import type { OperatingExpenseDto, RecordOperatingExpenseInputDto } from '../dtos/ExpenseDtos'
import type { OperatingExpense } from '../entities/OperatingExpense'
import { OperatingExpenseId } from '../entities/OperatingExpense'
import {
  isExpensePaymentStatus,
} from '../valueObjects/ExpensePaymentStatus'
import { isExpenseStatus } from '../valueObjects/ExpenseStatus'
import type { ExpenseCategory } from '../valueObjects/ExpenseCategory'
import { EXPENSE_CATEGORIES } from '../valueObjects/ExpenseCategory'
import type { RecordOperatingExpenseInput } from '../validation/expenseSchemas'

function assertCategory(code: string): ExpenseCategory {
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(code)) {
    throw new Error(`Invalid expense category: ${code}`)
  }
  return code as ExpenseCategory
}

export function mapOperatingExpenseDtoToDomain(dto: OperatingExpenseDto): OperatingExpense {
  if (!isExpensePaymentStatus(dto.paymentStatus)) {
    throw new Error(`Invalid payment status: ${dto.paymentStatus}`)
  }
  if (!isExpenseStatus(dto.status)) {
    throw new Error(`Invalid expense status: ${dto.status}`)
  }

  return {
    id: OperatingExpenseId.fromPersisted(dto.id),
    expenseDate: new Date(dto.expenseDateIso),
    categoryCode: assertCategory(dto.categoryCode),
    amountMinor: dto.amountMinor,
    paymentStatus: dto.paymentStatus,
    payeeName: dto.payeeName,
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

export function mapRecordExpenseInputToDto(
  input: RecordOperatingExpenseInput,
  recordedBy: string,
): RecordOperatingExpenseInputDto {
  return {
    expenseDateIso: input.expenseDateIso,
    categoryCode: input.categoryCode,
    amountMinor: rupeesToMinor(input.amountRupees),
    paymentStatus: input.paymentStatus,
    payeeName: input.payeeName.trim(),
    cashAccountId: input.paymentStatus === 'paid' ? input.cashAccountId : undefined,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    recordedBy,
  }
}

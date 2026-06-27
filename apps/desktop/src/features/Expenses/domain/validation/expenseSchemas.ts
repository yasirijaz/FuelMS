import { z } from 'zod'
import { EXPENSE_CATEGORIES } from '../valueObjects/ExpenseCategory'
import { EXPENSE_PAYMENT_STATUSES } from '../valueObjects/ExpensePaymentStatus'

export const recordOperatingExpenseInputSchema = z.object({
  expenseDateIso: z.string().min(1, 'Expense date is required.'),
  categoryCode: z.enum(EXPENSE_CATEGORIES),
  amountRupees: z.number().positive('Amount must be greater than zero.'),
  paymentStatus: z.enum(EXPENSE_PAYMENT_STATUSES),
  payeeName: z.string().trim().min(1, 'Payee name is required.'),
  cashAccountId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordOperatingExpenseInput = z.infer<typeof recordOperatingExpenseInputSchema>

export const operatingExpenseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['posted', 'void', 'all']).optional(),
})

export type OperatingExpenseListQuery = z.infer<typeof operatingExpenseListQuerySchema>

export const voidOperatingExpenseInputSchema = z.object({
  expenseId: z.string().min(1),
  version: z.number().int().min(1),
})

export type VoidOperatingExpenseInput = z.infer<typeof voidOperatingExpenseInputSchema>

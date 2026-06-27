import { z } from 'zod'
import { INCOME_CATEGORIES } from '../valueObjects/IncomeCategory'
import { INCOME_PAYMENT_STATUSES } from '../valueObjects/IncomePaymentStatus'

export const recordOperatingIncomeInputSchema = z.object({
  incomeDateIso: z.string().min(1, 'Income date is required.'),
  categoryCode: z.enum(INCOME_CATEGORIES),
  amountRupees: z.number().positive('Amount must be greater than zero.'),
  paymentStatus: z.enum(INCOME_PAYMENT_STATUSES),
  sourceName: z.string().trim().min(1, 'Income source is required.'),
  cashAccountId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordOperatingIncomeInput = z.infer<typeof recordOperatingIncomeInputSchema>

export const operatingIncomeListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['posted', 'void', 'all']).optional(),
})

export type OperatingIncomeListQuery = z.infer<typeof operatingIncomeListQuerySchema>

export const voidOperatingIncomeInputSchema = z.object({
  incomeId: z.string().min(1),
  version: z.number().int().min(1),
})

export type VoidOperatingIncomeInput = z.infer<typeof voidOperatingIncomeInputSchema>

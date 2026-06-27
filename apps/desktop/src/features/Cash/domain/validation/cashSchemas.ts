import { z } from 'zod'
import { CASH_ACCOUNT_TYPES } from '../valueObjects/CashAccountType'

export const createCashAccountInputSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required.'),
  accountType: z.enum(CASH_ACCOUNT_TYPES),
  openingBalanceRupees: z.number().min(0).optional(),
  displayOrder: z.number().int().optional(),
  notes: z.string().optional(),
})

export type CreateCashAccountInput = z.infer<typeof createCashAccountInputSchema>

export const updateCashAccountInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Account name is required.'),
  displayOrder: z.number().int(),
  notes: z.string().optional(),
  version: z.number().int().min(1),
})

export type UpdateCashAccountInput = z.infer<typeof updateCashAccountInputSchema>

export const cashAccountVersionInputSchema = z.object({
  accountId: z.string().min(1),
  version: z.number().int().min(1),
})

export type CashAccountVersionInput = z.infer<typeof cashAccountVersionInputSchema>

export const recordCashTransferInputSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountRupees: z.number().positive('Transfer amount must be greater than zero.'),
  transferredAtIso: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordCashTransferInput = z.infer<typeof recordCashTransferInputSchema>

export const cashTransferListQuerySchema = z.object({
  accountId: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
})

export type CashTransferListQuery = z.infer<typeof cashTransferListQuerySchema>

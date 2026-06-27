import { z } from 'zod'
import { PARTNER_ROLE_CODES } from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'

const personLedgerRecordInputSchema = z.object({
  partnerId: z.string().min(1, 'Partner is required.'),
  amountRupees: z.number().positive('Amount must be greater than zero.'),
  entryDateIso: z.string().min(1, 'Entry date is required.'),
  cashAccountId: z.string().min(1, 'Cash account is required.'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordPersonBorrowInput = z.infer<typeof personLedgerRecordInputSchema>
export type RecordPersonRepayBorrowedInput = RecordPersonBorrowInput
export type RecordPersonLendInput = RecordPersonBorrowInput
export type RecordPersonCollectLoanInput = RecordPersonBorrowInput

export const recordPersonBorrowInputSchema = personLedgerRecordInputSchema
export const recordPersonRepayBorrowedInputSchema = personLedgerRecordInputSchema
export const recordPersonLendInputSchema = personLedgerRecordInputSchema
export const recordPersonCollectLoanInputSchema = personLedgerRecordInputSchema

export const personLedgerBalanceListQuerySchema = z.object({
  search: z.string().trim().optional(),
  roleCode: z.enum(PARTNER_ROLE_CODES).optional(),
  nonZeroOnly: z.boolean().optional(),
})

export type PersonLedgerBalanceListQuery = z.infer<typeof personLedgerBalanceListQuerySchema>

export const personLedgerEntryListQuerySchema = z.object({
  partnerId: z.string().min(1, 'Partner id is required.'),
  limit: z.number().int().positive().optional(),
})

export type PersonLedgerEntryListQuery = z.infer<typeof personLedgerEntryListQuerySchema>

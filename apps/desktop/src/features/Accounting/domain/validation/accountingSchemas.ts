import { z } from 'zod'
import { POSTING_STATUSES } from '@fuelms/shared'

export const journalListQuerySchema = z.object({
  search: z.string().trim().optional(),
  postingStatus: z.enum(POSTING_STATUSES).optional(),
  fromDateIso: z.string().optional(),
  toDateIso: z.string().optional(),
  limit: z.number().int().positive().optional(),
})

export type JournalListQuery = z.infer<typeof journalListQuerySchema>

export const accountingPeriodVersionInputSchema = z.object({
  periodId: z.string().min(1, 'Period id is required.'),
  version: z.number().int().min(1),
})

export type AccountingPeriodVersionInput = z.infer<typeof accountingPeriodVersionInputSchema>

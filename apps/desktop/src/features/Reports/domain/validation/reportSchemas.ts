import { z } from 'zod'

function dateOnly(iso: string): string {
  return iso.split('T')[0] ?? iso
}

export const reportDateRangeQuerySchema = z
  .object({
    fromDateIso: z.string().trim().min(1, 'From date is required.'),
    toDateIso: z.string().trim().min(1, 'To date is required.'),
  })
  .refine((value) => dateOnly(value.fromDateIso) <= dateOnly(value.toDateIso), {
    message: 'From date must be on or before to date.',
    path: ['toDateIso'],
  })

export type ReportDateRangeQuery = z.infer<typeof reportDateRangeQuerySchema>

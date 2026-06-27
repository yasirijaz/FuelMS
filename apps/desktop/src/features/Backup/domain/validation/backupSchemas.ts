import { z } from 'zod'

export const backupAuditListQuerySchema = z.object({
  limit: z.number().int().positive('Limit must be a positive integer.').max(100).optional(),
})

export type BackupAuditListQuery = z.infer<typeof backupAuditListQuerySchema>

export const createBackupInputSchema = z.object({
  actor: z.string().trim().min(1, 'Actor is required.'),
  notes: z.string().trim().optional(),
})

export type CreateBackupInput = z.infer<typeof createBackupInputSchema>

export const restoreBackupInputSchema = z.object({
  backupId: z.string().trim().min(1, 'Backup id is required.'),
  actor: z.string().trim().min(1, 'Actor is required.'),
  acknowledgeReplace: z.literal(true, {
    message: 'You must acknowledge that current data will be replaced.',
  }),
})

export type RestoreBackupInput = z.infer<typeof restoreBackupInputSchema>

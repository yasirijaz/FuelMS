import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).optional()

/** Structural validation for UI/application commands — not authoritative over domain rules. */
export const createOrganizationInputSchema = z.object({
  name: z
    .string({ error: 'Organization name is required.' })
    .trim()
    .min(2, 'Organization name must be at least 2 characters.')
    .max(120, 'Organization name cannot exceed 120 characters.'),
  legalName: optionalText(200),
  address: optionalText(300),
  city: optionalText(100),
  phone: optionalText(30),
  taxId: optionalText(50),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>

export const updateOrganizationInputSchema = createOrganizationInputSchema.extend({
  id: z.string().min(1, 'Organization id is required.'),
  version: z.number().int().positive(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>

export const activateOrganizationInputSchema = z.object({
  organizationId: z.string().min(1, 'Organization id is required.'),
})

export type ActivateOrganizationInput = z.infer<typeof activateOrganizationInputSchema>

export const archiveOrganizationInputSchema = z.object({
  organizationId: z.string().min(1, 'Organization id is required.'),
  version: z.number().int().positive(),
})

export type ArchiveOrganizationInput = z.infer<typeof archiveOrganizationInputSchema>

export const initializeWorkspaceInputSchema = createOrganizationInputSchema.extend({
  workspaceName: z.string().trim().max(120, 'Workspace name cannot exceed 120 characters.').optional(),
})

export type InitializeWorkspaceInput = z.infer<typeof initializeWorkspaceInputSchema>

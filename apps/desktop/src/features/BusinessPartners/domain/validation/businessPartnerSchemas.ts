import { z } from 'zod'
import { PARTNER_ROLE_CODES } from '../valueObjects/PartnerRoleCode'

const optionalText = (max: number) => z.string().trim().max(max).optional()

const partnerRoleCodeSchema = z.enum(PARTNER_ROLE_CODES)

/** Structural validation for UI/application commands — not authoritative over domain rules. */
export const createBusinessPartnerInputSchema = z.object({
  displayName: z
    .string({ error: 'Display name is required.' })
    .trim()
    .min(1, 'Display name is required.')
    .max(200, 'Display name cannot exceed 200 characters.'),
  legalName: optionalText(200),
  phone: optionalText(30),
  email: optionalText(100),
  taxId: optionalText(50),
  address: optionalText(300),
  notes: optionalText(1000),
  roles: z
    .array(partnerRoleCodeSchema)
    .min(1, 'At least one role is required for a new partner.'),
})

export type CreateBusinessPartnerInput = z.infer<typeof createBusinessPartnerInputSchema>

export const updateBusinessPartnerInputSchema = z.object({
  id: z.string().min(1, 'Partner id is required.'),
  displayName: z
    .string({ error: 'Display name is required.' })
    .trim()
    .min(1, 'Display name is required.')
    .max(200, 'Display name cannot exceed 200 characters.'),
  legalName: optionalText(200),
  phone: optionalText(30),
  email: optionalText(100),
  taxId: optionalText(50),
  address: optionalText(300),
  notes: optionalText(1000),
  version: z.number().int().positive(),
})

export type UpdateBusinessPartnerInput = z.infer<typeof updateBusinessPartnerInputSchema>

export const businessPartnerListQuerySchema = z.object({
  search: z.string().trim().optional(),
  roleCode: partnerRoleCodeSchema.optional(),
  activeOnly: z.boolean().optional(),
})

export type BusinessPartnerListQuery = z.infer<typeof businessPartnerListQuerySchema>

export const partnerVersionInputSchema = z.object({
  partnerId: z.string().min(1, 'Partner id is required.'),
  version: z.number().int().positive(),
})

export type PartnerVersionInput = z.infer<typeof partnerVersionInputSchema>

export const assignPartnerRoleInputSchema = partnerVersionInputSchema.extend({
  roleCode: partnerRoleCodeSchema,
})

export type AssignPartnerRoleInput = z.infer<typeof assignPartnerRoleInputSchema>

export const removePartnerRoleInputSchema = assignPartnerRoleInputSchema

export type RemovePartnerRoleInput = z.infer<typeof removePartnerRoleInputSchema>

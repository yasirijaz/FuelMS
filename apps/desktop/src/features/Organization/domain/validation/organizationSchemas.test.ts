import { describe, expect, it } from 'vitest'
import {
  createOrganizationInputSchema,
  updateOrganizationInputSchema,
} from './organizationSchemas'

describe('organizationSchemas', () => {
  it('accepts valid create input', () => {
    const parsed = createOrganizationInputSchema.safeParse({
      name: 'Main Pump',
      city: 'Karachi',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects short organization name', () => {
    const parsed = createOrganizationInputSchema.safeParse({ name: 'A' })
    expect(parsed.success).toBe(false)
  })

  it('requires version on update', () => {
    const parsed = updateOrganizationInputSchema.safeParse({
      id: 'org-1',
      name: 'Updated Pump',
    })
    expect(parsed.success).toBe(false)
  })
})

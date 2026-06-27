import { describe, expect, it } from 'vitest'
import { Organization } from './entities/Organization'
import { OrganizationName } from './valueObjects/OrganizationName'

describe('Organization aggregate', () => {
  it('creates an active organization with domain event', () => {
    const name = OrganizationName.create('Main Pump')
    expect(name.ok).toBe(true)
    if (!name.ok) return

    const result = Organization.create({
      name: name.value,
      details: { city: 'Lahore', legalName: 'Main Pump Pvt Ltd' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.isActive).toBe(true)
    expect(result.value.city).toBe('Lahore')
    expect(result.value.peekDomainEvents()).toHaveLength(1)
    expect(result.value.peekDomainEvents()[0]?.eventType).toBe('organization.created')
  })

  it('rejects update on archived organization', () => {
    const name = OrganizationName.create('Archived Pump')
    expect(name.ok).toBe(true)
    if (!name.ok) return

    const created = Organization.create({ name: name.value })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const archived = created.value.archive()
    expect(archived.ok).toBe(true)

    const update = created.value.updateDetails({
      name: name.value,
      details: {
        legalName: null,
        address: null,
        city: null,
        phone: null,
        taxId: null,
      },
    })

    expect(update.ok).toBe(false)
    if (update.ok) return
    expect(update.error.code).toBe('ORGANIZATION_ARCHIVED')
  })

  it('archives an active organization once', () => {
    const name = OrganizationName.create('Pump Two')
    expect(name.ok).toBe(true)
    if (!name.ok) return

    const created = Organization.create({ name: name.value })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    expect(created.value.archive().ok).toBe(true)
    expect(created.value.isArchived).toBe(true)
    expect(created.value.archive().ok).toBe(false)
  })
})

describe('OrganizationName', () => {
  it('rejects blank and too-short names', () => {
    expect(OrganizationName.create(' ').ok).toBe(false)
    expect(OrganizationName.create('A').ok).toBe(false)
  })

  it('normalizes comparison value', () => {
    const name = OrganizationName.create('  Station Alpha  ')
    expect(name.ok).toBe(true)
    if (!name.ok) return
    expect(name.value.value).toBe('Station Alpha')
    expect(name.value.normalized()).toBe('station alpha')
  })
})

import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { DomainError } from '@fuelms/core'
import { ValueObject } from '@fuelms/domain'

interface OrganizationNameProps {
  value: string
}

export class OrganizationName extends ValueObject<OrganizationNameProps> {
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 120

  private constructor(props: OrganizationNameProps) {
    super(props)
  }

  static create(raw: string): Result<OrganizationName, DomainError> {
    const value = raw.trim()
    if (value.length < OrganizationName.MIN_LENGTH) {
      return err(
        new DomainError(
          'ORGANIZATION_NAME_TOO_SHORT',
          `Organization name must be at least ${OrganizationName.MIN_LENGTH} characters.`,
        ),
      )
    }
    if (value.length > OrganizationName.MAX_LENGTH) {
      return err(
        new DomainError(
          'ORGANIZATION_NAME_TOO_LONG',
          `Organization name cannot exceed ${OrganizationName.MAX_LENGTH} characters.`,
        ),
      )
    }
    return ok(new OrganizationName({ value }))
  }

  get value(): string {
    return this.props.value
  }

  normalized(): string {
    return this.props.value.toLowerCase()
  }
}

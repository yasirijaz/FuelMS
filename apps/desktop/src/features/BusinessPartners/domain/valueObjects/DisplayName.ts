import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { DomainError } from '@fuelms/core'
import { ValueObject } from '@fuelms/domain'

interface DisplayNameProps {
  value: string
}

export class DisplayName extends ValueObject<DisplayNameProps> {
  private static readonly MAX_LENGTH = 200

  private constructor(props: DisplayNameProps) {
    super(props)
  }

  static create(raw: string): Result<DisplayName, DomainError> {
    const value = raw.trim()
    if (value.length === 0) {
      return err(new DomainError('PARTNER_NAME_REQUIRED', 'Display name is required.'))
    }
    if (value.length > DisplayName.MAX_LENGTH) {
      return err(
        new DomainError(
          'PARTNER_NAME_TOO_LONG',
          `Display name cannot exceed ${DisplayName.MAX_LENGTH} characters.`,
        ),
      )
    }
    return ok(new DisplayName({ value }))
  }

  get value(): string {
    return this.props.value
  }

  normalized(): string {
    return this.props.value.toLowerCase()
  }
}

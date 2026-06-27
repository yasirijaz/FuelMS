import type { ErrorKind } from './AppError'
import { AppError } from './AppError'

// â”€â”€â”€ Domain Errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * DomainError â€” a business invariant was violated.
 *
 * Examples: "Inventory cannot become negative", "Sale price cannot be null",
 * "Owner withdrawal cannot be categorised as expense."
 *
 * These errors originate in the domain layer and carry domain-meaningful codes.
 * Use subclasses or concrete instances with descriptive codes.
 */
export class DomainError extends AppError {
  override readonly kind = 'domain' as const

  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause)
  }
}

/**
 * ValidationError â€” one or more input fields failed validation rules.
 *
 * Unlike DomainError (which enforces business invariants), ValidationError
 * enforces input shape: required fields, format, range, length, etc.
 *
 * `violations` contains one human-readable message per failed rule so the UI
 * can display all errors at once rather than one-at-a-time.
 */
export class ValidationError extends AppError {
  override readonly kind = 'validation' as const
  readonly violations: readonly string[]

  constructor(message: string, violations?: string[], cause?: unknown) {
    super('VALIDATION_ERROR', message, cause)
    this.violations = Object.freeze(violations ?? [message])
  }
}

// â”€â”€â”€ Application Errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * ApplicationError â€” a use-case-level failure that is not a domain violation.
 *
 * Examples: "Cannot archive a journal that has not been posted",
 * "Backup cannot run while a transaction is in progress."
 */
export class ApplicationError extends AppError {
  override readonly kind: ErrorKind = 'application'

  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause)
  }
}

/**
 * NotFoundError â€” the requested aggregate does not exist.
 *
 * Carries `entityType` (e.g. 'FuelBatch') and `id` so the UI can provide a
 * meaningful message without knowing the internal code.
 */
export class NotFoundError extends AppError {
  override readonly kind = 'not-found' as const

  constructor(
    readonly entityType: string,
    readonly entityId: string,
    cause?: unknown,
  ) {
    super(
      'NOT_FOUND',
      `${entityType} with id "${entityId}" was not found.`,
      cause,
    )
  }
}

/**
 * ConflictError â€” a conflict prevents the operation from completing.
 *
 * Use cases:
 * - Optimistic concurrency lock failure (another user saved the same record)
 * - Duplicate business document (duplicate journal reference)
 * - Attempted re-creation of an already-existing aggregate
 */
export class ConflictError extends AppError {
  override readonly kind = 'conflict' as const

  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause)
  }
}

// â”€â”€â”€ Infrastructure Errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * InfrastructureError â€” a persistence or IO operation failed.
 *
 * IMPORTANT: Never propagate raw SQLite messages, file paths, or stack traces
 * to the UI. This error class wraps the low-level cause and exposes only a
 * business-readable code and message.
 */
export class InfrastructureError extends AppError {
  override readonly kind = 'infrastructure' as const

  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause)
  }
}

// â”€â”€â”€ Security Errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * UnauthorizedError â€” the caller has not authenticated.
 * Presentation layer should redirect to the login screen.
 */
export class UnauthorizedError extends AppError {
  override readonly kind = 'unauthorized' as const

  constructor(message = 'Authentication is required to perform this action.', cause?: unknown) {
    super('UNAUTHORIZED', message, cause)
  }
}

/**
 * ForbiddenError â€” the caller is authenticated but lacks the required permission.
 * Presentation layer should display a "permission denied" message.
 */
export class ForbiddenError extends AppError {
  override readonly kind = 'forbidden' as const

  constructor(
    readonly action: string,
    message?: string,
    cause?: unknown,
  ) {
    super('FORBIDDEN', message ?? `You do not have permission to perform: ${action}`, cause)
  }
}

/**
 * UnexpectedError â€” a truly unexpected condition (programming error, not user error).
 *
 * Use this sparingly. If this error appears in logs, it indicates a bug that
 * must be fixed, not a user-facing error to display.
 */
export class UnexpectedError extends AppError {
  override readonly kind = 'unexpected' as const

  constructor(message: string, cause?: unknown) {
    super('UNEXPECTED_ERROR', message, cause)
  }
}

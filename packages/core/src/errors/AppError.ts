/**
 * AppError — base class for all application errors.
 *
 * Why a hierarchy over plain Error?
 * The AI Development Protocol states: "Business errors must be understandable to
 * operators. Technical errors must be logged with useful context. Never expose
 * raw SQLite messages or stack traces to end users."
 *
 * A typed hierarchy lets the presentation layer handle each ErrorKind differently:
 * - 'validation' → highlight the specific form fields
 * - 'not-found'  → show a "not found" message
 * - 'conflict'   → suggest the user refresh and retry
 * - 'unauthorized' → redirect to login
 * - 'infrastructure' → show a generic "something went wrong, please contact support"
 *
 * The `code` field is a machine-readable constant (e.g. 'NEGATIVE_INVENTORY',
 * 'DUPLICATE_JOURNAL') that the UI can use for i18n or telemetry without
 * pattern-matching on English message strings.
 *
 * Object.setPrototypeOf fix:
 * TypeScript compiles class extends Error to ES5 which breaks instanceof checks
 * unless the prototype is manually restored. This fix is required.
 */

export type ErrorKind =
  | 'domain'          // A business invariant was violated (e.g. negative inventory)
  | 'validation'      // User input failed validation (e.g. missing required field)
  | 'application'     // A use case failed at orchestration level
  | 'not-found'       // A requested aggregate does not exist
  | 'conflict'        // Concurrent modification or duplicate detected
  | 'infrastructure'  // A persistence or IO operation failed
  | 'unauthorized'    // The caller is not authenticated
  | 'forbidden'       // The caller is authenticated but not permitted
  | 'unexpected'      // A truly unexpected error that should never happen

export abstract class AppError extends Error {
  abstract readonly kind: ErrorKind

  constructor(
    /** Machine-readable identifier for this error type. */
    readonly code: string,
    message: string,
    /** The original error that caused this one, if any. */
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Human-readable summary suitable for logging. */
  toLogEntry(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      kind: this.kind,
      message: this.message,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    }
  }
}

/**
 * Logger — interface for structured, levelled logging.
 *
 * Why an interface and not the concrete implementation?
 * The AI Development Protocol states: "Business logic must never depend on React,
 * SQLite, Tauri, or any external framework."
 *
 * The domain and application layers import this INTERFACE. The concrete logger
 * (apps/desktop/src/shared/lib/logger.ts) lives in the presentation/infra layer
 * and implements this interface. Tests inject MockLogger or SpyLogger.
 *
 * Parameter design:
 * - `ctx`  — the module/class emitting the log (e.g. 'FuelBatchRepository')
 * - `msg`  — a concise human-readable description of what happened
 * - `data` — optional structured metadata for correlation, debugging, or audit
 *
 * Using Record<string, unknown> instead of `any` forces callers to structure
 * their log data as key-value pairs, making logs searchable.
 */

export interface Logger {
  debug(ctx: string, msg: string, data?: Record<string, unknown>): void
  info(ctx: string, msg: string, data?: Record<string, unknown>): void
  warn(ctx: string, msg: string, data?: Record<string, unknown>): void
  error(ctx: string, msg: string, data?: Record<string, unknown>): void
}

/**
 * NullLogger — a no-op implementation of Logger.
 *
 * Use as a default when a logger is optional (e.g. constructor injection
 * with a sensible default). Prevents null checks throughout the codebase.
 * For tests that don't care about log output, use NullLogger directly.
 * For tests that assert on log calls, use SpyLogger from @fuelms/testing.
 */
export class NullLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

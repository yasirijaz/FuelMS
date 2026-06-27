import type { Logger } from '@fuelms/core'

// ─── MockLogger ───────────────────────────────────────────────────────────────

/**
 * MockLogger — no-op logger for tests that don't care about log output.
 *
 * Use when testing business logic where log calls are a side effect
 * that you don't want to assert on.
 *
 * For assertions on log calls, use SpyLogger.
 */
export class MockLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

// ─── SpyLogger ────────────────────────────────────────────────────────────────

interface LogCall {
  readonly level: 'debug' | 'info' | 'warn' | 'error'
  readonly ctx: string
  readonly msg: string
  readonly data?: Record<string, unknown>
}

/**
 * SpyLogger — captures log calls for assertion in tests.
 *
 * Usage:
 *
 *   const logger = new SpyLogger()
 *   const service = new MyService(logger)
 *
 *   await service.doSomething()
 *
 *   const errors = logger.callsOf('error')
 *   expect(errors).toHaveLength(1)
 *   expect(errors[0].msg).toBe('Inventory would become negative')
 */
export class SpyLogger implements Logger {
  private readonly _calls: LogCall[] = []

  debug(ctx: string, msg: string, data?: Record<string, unknown>): void {
    this._calls.push({ level: 'debug', ctx, msg, data })
  }

  info(ctx: string, msg: string, data?: Record<string, unknown>): void {
    this._calls.push({ level: 'info', ctx, msg, data })
  }

  warn(ctx: string, msg: string, data?: Record<string, unknown>): void {
    this._calls.push({ level: 'warn', ctx, msg, data })
  }

  error(ctx: string, msg: string, data?: Record<string, unknown>): void {
    this._calls.push({ level: 'error', ctx, msg, data })
  }

  /** All captured log calls. */
  calls(): readonly LogCall[] {
    return [...this._calls]
  }

  /** Calls of a specific log level. */
  callsOf(level: LogCall['level']): readonly LogCall[] {
    return this._calls.filter((c) => c.level === level)
  }

  /** Calls whose context matches a string. */
  callsFrom(ctx: string): readonly LogCall[] {
    return this._calls.filter((c) => c.ctx === ctx)
  }

  /** Count of calls at a specific level. */
  countOf(level: LogCall['level']): number {
    return this.callsOf(level).length
  }

  /** True if any call at the given level was made. */
  logged(level: LogCall['level']): boolean {
    return this.countOf(level) > 0
  }

  /** Clear captured calls. Call in afterEach to reset state between tests. */
  reset(): void {
    this._calls.length = 0
  }
}

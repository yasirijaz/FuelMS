/**
 * Application logger.
 *
 * Provides structured, levelled logging. In development, messages are
 * formatted with colour and context. In production, only warn/error
 * emit (console stays quiet for end-users).
 *
 * Usage:
 *   import { logger } from '@shared/lib/logger'
 *   logger.info('FuelPage', 'Component mounted')
 *   logger.error('AccountingService', 'Post failed', { reason })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'

const COLOURS: Record<LogLevel, string> = {
  debug: '#6366f1', // indigo
  info: '#22c55e',  // green
  warn: '#f59e0b',  // amber
  error: '#ef4444', // red
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL]
}

function format(level: LogLevel, context: string, message: string): string {
  const ts = new Date().toISOString().substring(11, 23) // HH:MM:SS.mmm
  return `[${ts}] [${level.toUpperCase().padEnd(5)}] [${context}] ${message}`
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return

  const text = format(level, context, message)

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'info' : level](
      `%c${text}`,
      `color:${COLOURS[level]};font-weight:bold`,
      ...(data !== undefined ? [data] : []),
    )
  } else {
    if (level === 'error') {
      console.error(text, ...(data !== undefined ? [data] : []))
    } else if (level === 'warn') {
      console.warn(text, ...(data !== undefined ? [data] : []))
    }
  }
}

export const logger = {
  debug: (ctx: string, msg: string, data?: unknown) => log('debug', ctx, msg, data),
  info: (ctx: string, msg: string, data?: unknown) => log('info', ctx, msg, data),
  warn: (ctx: string, msg: string, data?: unknown) => log('warn', ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
} as const

export type Logger = typeof logger

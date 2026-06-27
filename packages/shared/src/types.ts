/** Branded primitive: forces callers to construct via helper, not raw cast. */
export type Brand<T, K extends string> = T & { readonly __brand: K }

/** A generic result type — avoids throwing across module boundaries. */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E }

/** ISO-8601 date string. */
export type ISODate = Brand<string, 'ISODate'>

/** Positive integer > 0 quantity. */
export type PositiveInt = Brand<number, 'PositiveInt'>

/** Application environment. */
export type AppEnv = 'development' | 'production' | 'test'

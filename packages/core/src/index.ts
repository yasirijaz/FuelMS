/**
 * @fuelms/core â€” Platform Primitives
 *
 * The innermost ring. Zero framework dependencies.
 * Can be imported by any package in the monorepo.
 *
 * Public API surface:
 *
 * Result<T, E>
 *   ok, err, isOk, isErr, map, flatMap, mapErr, match,
 *   unwrapOr, unwrap, unwrapErr, combine, combineAll, tryCatch
 *
 * UniqueId
 *   UniqueId.generate(), UniqueId.from(string), .equals(), .toString()
 *
 * Errors
 *   AppError (abstract), DomainError, ValidationError,
 *   ApplicationError, NotFoundError, ConflictError,
 *   InfrastructureError, UnauthorizedError, ForbiddenError, UnexpectedError
 *   ErrorKind (type)
 *
 * Logger
 *   Logger (interface), NullLogger
 *
 * Types
 *   Brand<T, K>, ISOTimestamp, ISODate, NonNegativeInt, PositiveNumber
 *   Nullable<T>, Optional<T>, Maybe<T>, DeepReadonly<T>
 */

export * from './result/index'
export * from './id/index'
export * from './errors/index'
export * from './logger/index'
export * from './types/index'

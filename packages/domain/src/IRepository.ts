import type { Result, UniqueId, NotFoundError, AppError } from '@fuelms/core'
import type { Entity } from './Entity'

/**
 * IRepository<T, ID> â€” generic repository contract.
 *
 * The Repository pattern (from ENGINEERING_STANDARDS.md):
 * "A repository is responsible for one thing: persisting and loading aggregates
 * for its owning domain. Repositories translate between the domain model and
 * durable storage. They do not own business rules, perform calculations, or
 * drive UI behaviour."
 *
 * This interface defines the minimal contract. Domain-specific repositories
 * extend this with business-oriented operations:
 *
 *   interface FuelBatchRepository extends IRepository<FuelBatch, FuelBatchId> {
 *     findAvailableBatches(productId: ProductId): Promise<Result<FuelBatch[], AppError>>
 *     findBatchesConsumedInPeriod(from: ISODate, to: ISODate): Promise<Result<FuelBatch[], AppError>>
 *   }
 *
 * Design decisions:
 *
 * 1. Returns Result<T, E> not throws â€” callers must explicitly handle errors.
 *    Follows the "fail closed" principle: if the repository fails, the business
 *    action cannot partially succeed.
 *
 * 2. Async all the way â€” even though SQLite is synchronous in many contexts,
 *    the interface is async to support future cloud sync, streaming, or remote
 *    databases without changing the contract.
 *
 * 3. No getAll() / deleteById() â€” the ENGINEERING_STANDARDS explicitly forbid
 *    generic CRUD operations. Repositories expose domain-oriented queries only.
 *    Feature repositories define specific query methods.
 *
 * 4. save() handles both insert and update â€” the repository determines whether
 *    the aggregate exists (based on ID) and performs the appropriate action.
 *    This is the "upsert" pattern. Version numbers on aggregates handle
 *    optimistic concurrency.
 *
 * 5. Transaction context is NOT on this interface â€” the application service
 *    passes a transaction handle to concrete repository methods via constructor
 *    injection or method parameters. See ITransactionContext in infrastructure.
 */

export interface IRepository<T extends Entity<ID>, ID extends UniqueId> {
  /**
   * Load a single aggregate by its ID.
   * Returns NotFoundError if the aggregate does not exist.
   */
  findById(id: ID): Promise<Result<T, NotFoundError>>

  /**
   * Persist the aggregate (insert or update).
   * The implementation decides whether to INSERT or UPDATE based on existence.
   * Returns an error if persistence fails.
   */
  save(entity: T): Promise<Result<void, AppError>>

  /**
   * Check existence without loading the full aggregate.
   * Lighter than findById when you only need to know if it exists.
   */
  exists(id: ID): Promise<boolean>
}

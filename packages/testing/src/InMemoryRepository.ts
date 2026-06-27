import type { Result, UniqueId, NotFoundError, AppError } from '@fuelms/core'
import { ok, err } from '@fuelms/core'
import { NotFoundError as NotFound } from '@fuelms/core'
import type { Entity, IRepository } from '@fuelms/domain'

/**
 * InMemoryRepository<T, ID> — base class for test repositories.
 *
 * Provides a Map-backed implementation of IRepository that works in any
 * JavaScript environment without a database or Tauri backend.
 *
 * Usage:
 *
 *   class FuelBatchRepositoryStub
 *     extends InMemoryRepository<FuelBatch, FuelBatchId>
 *     implements FuelBatchRepository
 *   {
 *     protected readonly entityType = 'FuelBatch'
 *
 *     // Implement domain-specific queries using this.store
 *     async findAvailableBatches(): Promise<Result<FuelBatch[], AppError>> {
 *       const available = this.all().filter(b => b.availableQuantity > 0)
 *       return ok(available)
 *     }
 *   }
 *
 * The extra test helpers (size(), all(), clear(), findAll()) allow test
 * assertions to verify what was saved without going through the domain API.
 */

export abstract class InMemoryRepository<T extends Entity<ID>, ID extends UniqueId>
  implements IRepository<T, ID>
{
  /** The underlying store — accessible to subclasses for custom queries. */
  protected readonly store = new Map<string, T>()

  /** The name of the entity type — used in NotFoundError messages. */
  protected abstract readonly entityType: string

  async findById(id: ID): Promise<Result<T, NotFoundError>> {
    const entity = this.store.get(id.toString())
    if (!entity) {
      return err(new NotFound(this.entityType, id.toString()))
    }
    return ok(entity)
  }

  async save(entity: T): Promise<Result<void, AppError>> {
    this.store.set(entity.id.toString(), entity)
    return ok(undefined)
  }

  async exists(id: ID): Promise<boolean> {
    return this.store.has(id.toString())
  }

  // ─── Test helpers ──────────────────────────────────────────────────────────

  /** Number of entities in the store. */
  size(): number {
    return this.store.size
  }

  /** All stored entities as an array. */
  all(): T[] {
    return [...this.store.values()]
  }

  /** Remove all entities. Call in afterEach to reset state between tests. */
  clear(): void {
    this.store.clear()
  }

  /** Find entities matching a predicate without loading via domain query. */
  findWhere(predicate: (entity: T) => boolean): T[] {
    return this.all().filter(predicate)
  }
}

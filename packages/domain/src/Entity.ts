import type { UniqueId } from '@fuelms/core'

/**
 * Entity<ID> — an object defined by its identity, not its attributes.
 *
 * The key distinction from ValueObject:
 * - Two Value Objects with the same properties are the same thing.
 * - Two Entities with the same ID are the same thing, EVEN IF their
 *   properties differ (e.g. the same Sale at two different points in time).
 *
 * DDD rule: Entities have identity and lifecycle. They may change state over
 * time while remaining the "same" entity.
 *
 * Examples of Entities in FuelERP:
 *   FuelBatch   — a specific delivery of fuel with an ID, received at a date
 *   Sale        — a single sale transaction
 *   Expense     — a recorded business or personal expense
 *   JournalEntry — a double-entry accounting posting
 *   Person      — a named party (supplier, employee, owner, family member)
 *
 * Design decisions:
 *
 * 1. Generic over ID extends UniqueId — ensures each entity uses a typed ID
 *    class. Prevents passing a SaleId where a PersonId is expected.
 *
 * 2. Protected constructor — entities are created via static factory methods
 *    on subclasses that validate invariants and produce the aggregate with
 *    any necessary initial state.
 *
 * 3. equals() uses constructor check — a Sale and an Expense that happen to
 *    share a UUID are NOT equal. Constructor identity ensures type safety
 *    at runtime in addition to the TypeScript type system.
 *
 * NOTE: Entity does NOT collect domain events. That capability lives in
 * AggregateRoot. Not every entity is an aggregate root — for example, a
 * JournalLine is an Entity that belongs to a JournalEntry aggregate root.
 */

export abstract class Entity<ID extends UniqueId> {
  protected constructor(readonly id: ID) {}

  /**
   * Two entities are equal iff they are the same class AND have the same ID.
   */
  equals(other: Entity<ID>): boolean {
    if (other === null || other === undefined) return false
    if (other.constructor !== this.constructor) return false
    return this.id.equals(other.id)
  }

  toString(): string {
    return `${this.constructor.name}(${this.id.toString()})`
  }
}

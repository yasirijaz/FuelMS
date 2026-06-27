import type { UniqueId } from '@fuelms/core'
import { Entity } from './Entity'
import type { DomainEvent } from './DomainEvent'

/**
 * AggregateRoot<ID> â€” the consistency boundary for a cluster of entities.
 *
 * An Aggregate is a cluster of domain objects (entities + value objects) that
 * must remain consistent with each other. The root is the entry point â€” all
 * external operations must go through the root.
 *
 * Why this matters for FuelERP:
 * A FuelBatch (aggregate root) owns its inventory state. Nothing outside the
 * FuelBatch should directly mutate the quantity â€” all changes go through
 * methods like batch.consumeForSale(quantity). The aggregate enforces invariants
 * before raising events.
 *
 * Event collection pattern:
 * 1. A use-case calls an aggregate method (e.g. fuelBatch.consumeForSale(10))
 * 2. The method validates the business rule (can't go below zero)
 * 3. If valid, mutates internal state and calls this.raise(new FuelConsumed(...))
 * 4. The repository saves the mutated aggregate
 * 5. The application service calls pullDomainEvents() AFTER the save
 * 6. The event bus dispatches the collected events
 *
 * This ordering guarantees: events are only published for state that was
 * successfully persisted. No partial success states.
 *
 * peekDomainEvents() vs pullDomainEvents():
 * - peek: inspect events without clearing (for testing/debugging)
 * - pull: return AND clear the list (production use after persistence)
 */

export abstract class AggregateRoot<ID extends UniqueId> extends Entity<ID> {
  /** Internal event list â€” not accessible from outside the class hierarchy. */
  private readonly _domainEvents: DomainEvent[] = []

  protected constructor(id: ID) {
    super(id)
  }

  /**
   * Raise a domain event.
   * Called by aggregate methods AFTER state has been mutated and validated.
   * Events accumulate here until the application service pulls them post-save.
   */
  protected raise(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  /**
   * Return all accumulated events and clear the internal list.
   * Call this AFTER successfully persisting the aggregate.
   * The application service passes these events to the event bus.
   */
  pullDomainEvents(): DomainEvent[] {
    return this._domainEvents.splice(0)
  }

  /**
   * Inspect accumulated events without clearing them.
   * Use in unit tests to assert which events were raised without consuming them.
   */
  peekDomainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents]
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0
  }

  domainEventCount(): number {
    return this._domainEvents.length
  }
}

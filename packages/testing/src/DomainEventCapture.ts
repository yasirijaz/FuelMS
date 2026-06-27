import type { DomainEvent, AggregateRoot } from '@fuelms/domain'
import type { UniqueId } from '@fuelms/core'

/**
 * DomainEventCapture — captures and inspects domain events in tests.
 *
 * The ENGINEERING_STANDARDS and AI Development Protocol both require that
 * "every business rule should be testable in the domain or application layer."
 * Event assertions are a core part of domain layer testing.
 *
 * Usage:
 *
 *   const capture = new DomainEventCapture()
 *   const batch = FuelBatch.create(command)
 *   capture.from(batch)  // pulls events from the aggregate
 *
 *   expect(capture.count()).toBe(1)
 *   const [event] = capture.ofType<FuelBatchCreated>('fuel.batch.created')
 *   expect(event.productId).toBe(command.productId)
 *
 * Note: capture.from() calls pullDomainEvents() which CLEARS the aggregate's
 * internal list. If you need to inspect events without consuming them, use
 * aggregate.peekDomainEvents() directly.
 */

export class DomainEventCapture {
  private readonly captured: DomainEvent[] = []

  /**
   * Pull and capture all events from the given aggregate root.
   * This clears the aggregate's internal event list.
   */
  from<ID extends UniqueId>(aggregate: AggregateRoot<ID>): this {
    this.captured.push(...aggregate.pullDomainEvents())
    return this
  }

  /**
   * Manually add events (e.g. from an event bus spy).
   */
  add(...events: DomainEvent[]): this {
    this.captured.push(...events)
    return this
  }

  /** All captured events in order. */
  all(): readonly DomainEvent[] {
    return [...this.captured]
  }

  /** Events of a specific type, cast to T. */
  ofType<T extends DomainEvent>(eventType: string): T[] {
    return this.captured.filter((e) => e.eventType === eventType) as T[]
  }

  /** First event of a specific type, or undefined. */
  firstOfType<T extends DomainEvent>(eventType: string): T | undefined {
    return this.captured.find((e) => e.eventType === eventType) as T | undefined
  }

  /** Total number of captured events. */
  count(): number {
    return this.captured.length
  }

  /** True if any events of the given type were captured. */
  has(eventType: string): boolean {
    return this.captured.some((e) => e.eventType === eventType)
  }

  /** Count of events of a specific type. */
  countOf(eventType: string): number {
    return this.ofType(eventType).length
  }

  /** Clear all captured events. */
  reset(): void {
    this.captured.length = 0
  }
}

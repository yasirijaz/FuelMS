import { UniqueId } from '@fuelms/core'

/**
 * DomainEvent — an immutable record of something that HAS happened in the domain.
 *
 * Key invariants (from the EDA Architecture document):
 * - Events describe something that HAS happened, not something that WILL happen.
 * - Events are named in past tense: FuelPurchased, SaleCompleted, PriceChanged.
 * - Events are historical facts — they must never be edited after publication.
 * - Every meaningful business state change generates a domain event.
 *
 * Lifecycle (from EDA document):
 *   Business Action → Validation → State Change → Domain Event raised → Other domains react
 *
 * Events are collected by AggregateRoot.raise() and dispatched AFTER the aggregate
 * is persisted, not before. This ensures the event payload matches the committed state.
 *
 * Metadata fields (satisfying EDA payload guidelines):
 * - `eventId`       — globally unique ID for this specific event occurrence
 * - `occurredAt`    — UTC timestamp of the business action
 * - `aggregateId`   — which aggregate produced this event
 * - `aggregateType` — the class of the producing aggregate (e.g. 'FuelBatch')
 * - `correlationId` — links events that belong to the same business operation
 *                     (e.g. a fuel purchase that creates a batch AND posts a journal)
 *
 * Subclass pattern:
 *
 *   export class FuelPurchased extends DomainEvent {
 *     readonly eventType = 'fuel.purchased' as const
 *
 *     constructor(
 *       aggregateId: string,
 *       readonly productId: string,
 *       readonly quantityLitres: number,
 *       readonly unitCostMinor: number,
 *       correlationId?: string,
 *     ) {
 *       super(aggregateId, 'FuelBatch', correlationId)
 *     }
 *   }
 *
 * Why is eventType abstract and not passed to the constructor?
 * It makes it impossible to instantiate DomainEvent without declaring the type.
 * It also keeps the type as a compile-time constant (literal string type) on the
 * subclass, which enables discriminated union narrowing in event handlers.
 */

export abstract class DomainEvent {
  /** Unique ID of this specific event occurrence. */
  readonly eventId: string

  /** UTC timestamp of when the business action occurred. */
  readonly occurredAt: Date

  /**
   * The name of this event, in past-tense dot notation.
   * Convention: '<domain>.<past-tense-verb>' e.g. 'fuel.purchased', 'sale.completed'
   */
  abstract readonly eventType: string

  protected constructor(
    /** The string ID of the aggregate root that raised this event. */
    readonly aggregateId: string,
    /** The class name of the aggregate root (e.g. 'FuelBatch'). */
    readonly aggregateType: string,
    /**
     * Correlation ID linking events from the same business operation.
     * Defaults to `aggregateId` when not provided.
     */
    readonly correlationId: string = aggregateId,
  ) {
    this.eventId = UniqueId.generate().toString()
    this.occurredAt = new Date()
  }

  /** Serializable representation suitable for logging or event store persistence. */
  toRecord(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      correlationId: this.correlationId,
      occurredAt: this.occurredAt.toISOString(),
    }
  }
}

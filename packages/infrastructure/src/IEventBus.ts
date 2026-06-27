import type { DomainEvent } from '@fuelms/domain'
import type { IDomainEventDispatcher } from '@fuelms/domain'

/**
 * IEventBus — full event bus contract (publish + subscribe).
 *
 * Extends IDomainEventDispatcher (which only covers publishing) with
 * subscription capabilities. The event bus lives in the infrastructure layer
 * because it has infrastructure concerns: routing, handler registration, retry.
 *
 * Architecture note (from EDA document):
 * - Domain events are raised by aggregate roots.
 * - Application services dispatch them after persistence.
 * - Other domains react by subscribing to specific event types.
 * - The accounting domain subscribes to fuel.purchased, sale.completed, etc.
 * - The reporting domain subscribes to all events.
 *
 * The type parameter on subscribe() enables discriminated union narrowing:
 *
 *   eventBus.subscribe<FuelPurchased>('fuel.purchased', async (event) => {
 *     // event.productId is available without casting
 *   })
 *
 * Handler errors:
 * Handlers should not throw. If they do, the event bus logs the error and
 * continues to other handlers. Financial operations that fail in their handler
 * should use their own error recovery (retry, dead-letter queue in future).
 */

export interface IEventBus extends IDomainEventDispatcher {
  /**
   * Register a handler for a specific event type.
   * Handlers are called in registration order.
   * Multiple handlers for the same event type are all called.
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): void

  /**
   * Remove a previously registered handler.
   */
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): void

  /**
   * Remove all handlers. Useful between tests to prevent cross-test pollution.
   */
  clear(): void
}

/** A function that handles a domain event. Must not throw. */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>

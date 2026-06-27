import type { DomainEvent } from '@fuelms/domain'
import type { IEventBus, EventHandler } from './IEventBus'
import { NullLogger } from '@fuelms/core'
import type { Logger } from '@fuelms/core'

/**
 * InMemoryEventBus â€” synchronous in-memory event bus.
 *
 * This is the ONLY concrete implementation in the infrastructure package.
 * All other implementations (TauriEventBus, CloudEventBus) live in apps.
 *
 * Why provide this here:
 * Tests need an event bus that doesn't require a running Tauri backend.
 * This implementation is suitable for both tests AND the desktop app's
 * current Version 1 (no inter-process or cross-network event routing needed).
 *
 * In Version 1, the app is single-process, offline-only. Domain events
 * are dispatched synchronously in the same process. A future cloud sync
 * version would replace this with a persistent event store or message queue.
 *
 * Error isolation:
 * If a handler throws, the error is logged and execution continues to the
 * next handler. This prevents one misbehaving subscriber from blocking
 * accounting from receiving its event.
 *
 * Usage in tests:
 *
 *   const bus = new InMemoryEventBus()
 *   bus.subscribe<FuelPurchased>('fuel.purchased', async (event) => {
 *     capturedEvents.push(event)
 *   })
 *   await service.execute(command)
 *   expect(capturedEvents).toHaveLength(1)
 *   bus.clear()
 */

export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>()

  constructor(private readonly logger: Logger = new NullLogger()) {}

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler as EventHandler)
  }

  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler as EventHandler)
  }

  clear(): void {
    this.handlers.clear()
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? new Set<EventHandler>()
    this.logger.debug('InMemoryEventBus', `Dispatching ${event.eventType}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      handlerCount: handlers.size,
    })
    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (err) {
        this.logger.error('InMemoryEventBus', `Handler failed for ${event.eventType}`, {
          eventId: event.eventId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  async dispatchAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.dispatch(event)
    }
  }
}

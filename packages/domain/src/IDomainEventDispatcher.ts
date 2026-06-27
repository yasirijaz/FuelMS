import type { DomainEvent } from './DomainEvent'

/**
 * IDomainEventDispatcher â€” contract for publishing domain events.
 *
 * Application services use this interface to dispatch events collected from
 * aggregate roots AFTER successfully persisting the aggregate. This ensures
 * events are published only for state that is durably committed.
 *
 * Separated from IEventBus (in @fuelms/infrastructure) because:
 * - Application services need to dispatch events â€” they import this interface.
 * - Application services should NOT depend on infrastructure.
 * - The concrete event bus (InMemoryEventBus, TauriEventBus) implements
 *   both IDomainEventDispatcher and IEventBus.
 *
 * Usage in an application service:
 *
 *   class RecordFuelPurchaseService {
 *     constructor(
 *       private readonly batchRepo: FuelBatchRepository,
 *       private readonly events: IDomainEventDispatcher,
 *     ) {}
 *
 *     async execute(cmd: RecordFuelPurchaseCommand): Promise<Result<void, AppError>> {
 *       const batchResult = FuelBatch.create(cmd)
 *       if (isErr(batchResult)) return batchResult
 *
 *       const batch = batchResult.value
 *       const saveResult = await this.batchRepo.save(batch)
 *       if (isErr(saveResult)) return saveResult
 *
 *       await this.events.dispatchAll(batch.pullDomainEvents())
 *       return ok(undefined)
 *     }
 *   }
 */

export interface IDomainEventDispatcher {
  /** Dispatch a single domain event. */
  dispatch(event: DomainEvent): Promise<void>

  /** Dispatch all events from an aggregate root's pulled event list. */
  dispatchAll(events: DomainEvent[]): Promise<void>
}

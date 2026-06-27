/**
 * @fuelms/infrastructure â€” Infrastructure Contracts
 *
 * Depends on: @fuelms/core, @fuelms/domain
 * Framework: none
 * Runtime: none required (InMemoryEventBus runs in any JS environment)
 *
 * Public API:
 *
 * ITransactionContext  â€” active database transaction scope
 * IUnitOfWork          â€” atomic multi-repository operation coordinator
 * IEventBus            â€” full publish + subscribe event bus contract
 * EventHandler<T>      â€” type for event handler functions
 * InMemoryEventBus     â€” synchronous in-memory implementation (for dev + tests)
 */

export type { ITransactionContext } from './ITransactionContext'
export type { IUnitOfWork } from './IUnitOfWork'
export type { IEventBus, EventHandler } from './IEventBus'
export { InMemoryEventBus } from './InMemoryEventBus'

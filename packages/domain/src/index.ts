/**
 * @fuelms/domain â€” DDD Building Blocks
 *
 * Depends on: @fuelms/core
 * Framework: none
 * Persistence: none
 *
 * Public API:
 *
 * ValueObject<Props>    â€” base for immutable objects equal by value
 * Entity<ID>            â€” base for objects equal by identity
 * AggregateRoot<ID>     â€” extends Entity, collects domain events
 * DomainEvent           â€” base for past-tense domain facts
 * IRepository<T, ID>   â€” generic persistence contract
 * IDomainEventDispatcher â€” contract for publishing events from application services
 */

export { ValueObject } from './ValueObject'
export type { ValidationResult } from './ValueObject'
export { Entity } from './Entity'
export { AggregateRoot } from './AggregateRoot'
export { DomainEvent } from './DomainEvent'
export type { IRepository } from './IRepository'
export type { IDomainEventDispatcher } from './IDomainEventDispatcher'

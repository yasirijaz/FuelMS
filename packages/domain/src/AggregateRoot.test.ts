import { describe, it, expect } from 'vitest'
import { UniqueId } from '@fuelms/core'
import { AggregateRoot } from './AggregateRoot'
import { Entity } from './Entity'
import { DomainEvent } from './DomainEvent'

// ─── Fixtures ────────────────────────────────────────────────────────────────

class TestId extends UniqueId {
  static create(value: string): TestId { return new TestId(value) }
}

class ThingCreated extends DomainEvent {
  readonly eventType = 'thing.created' as const
  constructor(aggregateId: string) { super(aggregateId, 'Thing') }
}

class ThingUpdated extends DomainEvent {
  readonly eventType = 'thing.updated' as const
  constructor(aggregateId: string, readonly newName: string) {
    super(aggregateId, 'Thing')
  }
}

class Thing extends AggregateRoot<TestId> {
  private _name: string

  private constructor(id: TestId, name: string) {
    super(id)
    this._name = name
  }

  static create(id: string, name: string): Thing {
    const thing = new Thing(TestId.create(id), name)
    thing.raise(new ThingCreated(id))
    return thing
  }

  rename(newName: string): void {
    this._name = newName
    this.raise(new ThingUpdated(this.id.toString(), newName))
  }

  get name(): string { return this._name }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AggregateRoot - event collection', () => {
  it('raise() adds a domain event', () => {
    const thing = Thing.create('id-001', 'Widget')
    expect(thing.domainEventCount()).toBe(1)
    expect(thing.hasDomainEvents()).toBe(true)
  })

  it('multiple raise() calls accumulate in order', () => {
    const thing = Thing.create('id-001', 'Widget')
    thing.rename('Super Widget')
    expect(thing.domainEventCount()).toBe(2)
    const events = thing.peekDomainEvents()
    expect(events[0].eventType).toBe('thing.created')
    expect(events[1].eventType).toBe('thing.updated')
  })

  it('peekDomainEvents() does NOT clear the list', () => {
    const thing = Thing.create('id-001', 'Widget')
    thing.peekDomainEvents()
    expect(thing.domainEventCount()).toBe(1)
  })

  it('pullDomainEvents() returns all events and clears the list', () => {
    const thing = Thing.create('id-001', 'Widget')
    thing.rename('Super Widget')
    const events = thing.pullDomainEvents()
    expect(events).toHaveLength(2)
    expect(thing.domainEventCount()).toBe(0)
    expect(thing.hasDomainEvents()).toBe(false)
  })

  it('events carry the correct aggregate metadata', () => {
    const thing = Thing.create('agg-999', 'Gadget')
    const [event] = thing.pullDomainEvents()
    expect(event.aggregateId).toBe('agg-999')
    expect(event.aggregateType).toBe('Thing')
    expect(event.eventType).toBe('thing.created')
    expect(event.eventId).toBeTruthy()
    expect(event.occurredAt).toBeInstanceOf(Date)
  })
})

describe('Entity - equality via AggregateRoot', () => {
  it('same class and same ID are equal', () => {
    const a = Thing.create('same-id', 'A')
    const b = Thing.create('same-id', 'B')
    expect(a.equals(b)).toBe(true)
  })

  it('different IDs are not equal', () => {
    const a = Thing.create('id-001', 'A')
    const b = Thing.create('id-002', 'A')
    expect(a.equals(b)).toBe(false)
  })

  it('different classes with same ID are not equal', () => {
    class OtherThing extends Entity<TestId> {
      constructor(id: string) { super(TestId.create(id)) }
    }
    const thing = Thing.create('shared-id', 'name')
    const other = new OtherThing('shared-id')
    expect(thing.equals(other as unknown as Thing)).toBe(false)
  })
})

describe('DomainEvent - metadata', () => {
  it('each event has a unique eventId', () => {
    const thing = Thing.create('id-001', 'Widget')
    thing.rename('New Name')
    const [created, updated] = thing.pullDomainEvents()
    expect(created.eventId).not.toBe(updated.eventId)
  })

  it('correlationId defaults to aggregateId when not set', () => {
    const thing = Thing.create('id-001', 'Widget')
    const [event] = thing.pullDomainEvents()
    expect(event.correlationId).toBe('id-001')
  })

  it('toRecord() returns a serializable object', () => {
    const thing = Thing.create('id-001', 'Widget')
    const [event] = thing.pullDomainEvents()
    const record = event.toRecord()
    expect(record.eventType).toBe('thing.created')
    expect(typeof record.occurredAt).toBe('string')
    expect(record.aggregateId).toBe('id-001')
  })
})

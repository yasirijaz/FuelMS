import { UniqueId } from '@fuelms/core'

/**
 * Test ID helpers — deterministic IDs for stable test expectations.
 *
 * Why not just use crypto.randomUUID() in tests?
 * Random IDs make test output non-deterministic. When a test asserts on
 * an event's aggregateId, using a known ID makes the assertion clear
 * and the test output readable.
 *
 * Usage:
 *
 *   const id = createTestId('batch')    // 'batch-000001'
 *   const id2 = createTestId('batch')  // 'batch-000002'
 *   const id3 = nextId()               // '00000003'
 *   resetIdCounter()                   // reset to 0 in afterEach
 */

let _counter = 0

/**
 * Create a deterministic test ID with an optional prefix.
 * Increments a global counter on each call.
 */
export function createTestId(prefix = 'test'): string {
  _counter++
  return `${prefix}-${String(_counter).padStart(6, '0')}`
}

/**
 * Create a pure numeric test ID.
 */
export function nextId(): string {
  _counter++
  return String(_counter).padStart(8, '0')
}

/**
 * Reset the ID counter. Call in afterEach or beforeEach.
 */
export function resetIdCounter(): void {
  _counter = 0
}

/**
 * A TestUniqueId for use in unit tests.
 * Creates a UniqueId from a deterministic string.
 */
export class TestUniqueId extends UniqueId {
  static create(label = 'test'): TestUniqueId {
    return new TestUniqueId(createTestId(label))
  }

  static fromString(value: string): TestUniqueId {
    return new TestUniqueId(value)
  }
}

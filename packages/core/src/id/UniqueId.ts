/**
 * UniqueId — typed identity wrapper.
 *
 * Why not a raw string?
 * A string is structurally typed in TypeScript. Two aggregate IDs that happen
 * to be strings are interchangeable at the type level — passing a PersonId
 * where a FuelBatchId is expected is a silent runtime bug.
 *
 * Why not a branded type (type FuelBatchId = string & { __brand: 'FuelBatchId' })?
 * Branded types require explicit casting everywhere. A class-based approach gives
 * natural subclassing, is Object-oriented (matching DDD's Entity model), and allows
 * methods (equals, toString, toJSON) without boilerplate.
 *
 * Usage — define a typed ID per aggregate:
 *
 *   export class FuelBatchId extends UniqueId {
 *     static create(): FuelBatchId { return new FuelBatchId(UniqueId.generate()._value) }
 *     static from(id: string): FuelBatchId { return new FuelBatchId(id) }
 *   }
 *
 *   function findBatch(id: FuelBatchId): ...
 *   findBatch(personId)  // ← compile error: PersonId is not FuelBatchId ✓
 *
 * Generation:
 *   Uses crypto.randomUUID() (RFC 4122 v4 UUID) which is available in:
 *   - Modern browsers (Chrome 92+, Firefox 95+)
 *   - Node.js 14.17+
 *   - Tauri WebView (Chromium-based)
 *   - Vitest / jsdom test environments
 *   Falls back to a Math.random()-based UUID for environments without Web Crypto.
 */

export class UniqueId {
  /** Internal value — use toString() for serialization. */
  protected readonly _value: string

  protected constructor(value: string) {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new Error('[UniqueId] Value cannot be empty or whitespace.')
    }
    this._value = trimmed
  }

  // ─── Factory ───────────────────────────────────────────────────────────────

  /** Generate a new, globally unique ID. */
  static generate(): UniqueId {
    return new UniqueId(UniqueId._generateValue())
  }

  /**
   * Reconstruct a UniqueId from a persisted string.
   * Use when loading entities from the database.
   */
  static from(value: string): UniqueId {
    return new UniqueId(value)
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  /** Generates a UUID v4 string using the Web Crypto API with a Math.random fallback. */
  protected static _generateValue(): string {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto?.randomUUID === 'function'
    ) {
      return globalThis.crypto.randomUUID()
    }
    // Fallback: RFC 4122-compliant UUID v4 without Web Crypto
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }

  // ─── Comparison ───────────────────────────────────────────────────────────

  /**
   * Structural equality: same class AND same value.
   * A FuelBatchId and a PersonId with the same string are NOT equal.
   */
  equals(other: UniqueId): boolean {
    return this.constructor === other.constructor && this._value === other._value
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  toString(): string {
    return this._value
  }

  /** Allows JSON.stringify to correctly serialize the value. */
  toJSON(): string {
    return this._value
  }
}

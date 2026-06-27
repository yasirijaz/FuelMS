/**
 * @fuelms/testing â€” Test Utilities
 *
 * IMPORTANT: This package must NEVER be imported in production code.
 * It is a devDependency only. Add this to feature package.json:
 *   "devDependencies": { "@fuelms/testing": "workspace:*" }
 *
 * Public API:
 *
 * InMemoryRepository<T, ID>  â€” Map-backed repository base for tests
 * MockLogger                 â€” no-op logger (use when logs are irrelevant)
 * SpyLogger                  â€” captures log calls for assertion
 * DomainEventCapture         â€” captures and inspects domain events
 * assertOk, assertErr        â€” descriptive Result assertions
 * assertOkWith, assertErrWith â€” Result assertions with inline assertion functions
 * createTestId, nextId       â€” deterministic test ID generators
 * resetIdCounter             â€” reset ID counter between tests
 * TestUniqueId               â€” UniqueId subclass for test fixtures
 */

export { InMemoryRepository } from './InMemoryRepository'
export { MockLogger, SpyLogger } from './Loggers'
export { DomainEventCapture } from './DomainEventCapture'
export { assertOk, assertErr, assertOkWith, assertErrWith } from './ResultAssert'
export { createTestId, nextId, resetIdCounter, TestUniqueId } from './helpers'

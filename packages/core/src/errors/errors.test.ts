import { describe, it, expect } from 'vitest'
import {
  DomainError, ValidationError, ApplicationError,
  NotFoundError, ConflictError, InfrastructureError,
  UnauthorizedError, ForbiddenError, UnexpectedError,
} from './errors'

describe('Error hierarchy - kind', () => {
  it('DomainError has kind=domain', () => {
    expect(new DomainError('CODE', 'msg').kind).toBe('domain')
  })
  it('ValidationError has kind=validation', () => {
    expect(new ValidationError('msg').kind).toBe('validation')
  })
  it('ApplicationError has kind=application', () => {
    expect(new ApplicationError('CODE', 'msg').kind).toBe('application')
  })
  it('NotFoundError has kind=not-found', () => {
    expect(new NotFoundError('FuelBatch', '123').kind).toBe('not-found')
  })
  it('ConflictError has kind=conflict', () => {
    expect(new ConflictError('DUPE', 'msg').kind).toBe('conflict')
  })
  it('InfrastructureError has kind=infrastructure', () => {
    expect(new InfrastructureError('DB_ERR', 'msg').kind).toBe('infrastructure')
  })
  it('UnauthorizedError has kind=unauthorized', () => {
    expect(new UnauthorizedError().kind).toBe('unauthorized')
  })
  it('ForbiddenError has kind=forbidden', () => {
    expect(new ForbiddenError('delete_record').kind).toBe('forbidden')
  })
  it('UnexpectedError has kind=unexpected', () => {
    expect(new UnexpectedError('msg').kind).toBe('unexpected')
  })
})

describe('Error hierarchy - instanceof', () => {
  it('DomainError is an Error', () => {
    expect(new DomainError('CODE', 'msg')).toBeInstanceOf(Error)
  })

  it('ValidationError is an Error', () => {
    expect(new ValidationError('invalid input')).toBeInstanceOf(Error)
  })

  it('NotFoundError message includes entity type and id', () => {
    const e = new NotFoundError('FuelBatch', 'batch-001')
    expect(e.message).toContain('FuelBatch')
    expect(e.message).toContain('batch-001')
  })
})

describe('ValidationError - violations', () => {
  it('defaults violations to [message] when not provided', () => {
    const e = new ValidationError('single message')
    expect(e.violations).toEqual(['single message'])
  })

  it('stores all provided violations', () => {
    const e = new ValidationError('multiple errors', ['field1 required', 'field2 too long'])
    expect(e.violations).toHaveLength(2)
    expect(e.violations[0]).toBe('field1 required')
  })

  it('violations array is frozen (runtime immutable)', () => {
    const e = new ValidationError('msg', ['v1'])
    // Object.freeze prevents array mutations at runtime
    expect(() => {
      ;(e.violations as unknown as string[]).push('v2')
    }).toThrow()
  })
})

describe('AppError - toLogEntry', () => {
  it('returns a structured log-friendly object', () => {
    const e = new DomainError('NEGATIVE_INVENTORY', 'Stock cannot go below zero')
    const entry = e.toLogEntry()
    expect(entry.code).toBe('NEGATIVE_INVENTORY')
    expect(entry.kind).toBe('domain')
    expect(entry.message).toBe('Stock cannot go below zero')
  })
})

describe('Error name', () => {
  it('uses the class name as error name', () => {
    expect(new DomainError('C', 'm').name).toBe('DomainError')
    expect(new ValidationError('m').name).toBe('ValidationError')
    expect(new NotFoundError('T', 'id').name).toBe('NotFoundError')
  })
})

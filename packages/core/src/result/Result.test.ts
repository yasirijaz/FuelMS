import { describe, it, expect } from 'vitest'
import type { Result } from './Result'
import {
  ok, err, isOk, isErr,
  map, flatMap, mapErr,
  match, unwrapOr, unwrap, unwrapErr,
  combine, combineAll, tryCatch,
} from './Result'

describe('Result - constructors', () => {
  it('ok() creates an Ok result', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    expect(r.value).toBe(42)
  })

  it('err() creates an Err result', () => {
    const r = err('something failed')
    expect(r.ok).toBe(false)
    expect(r.error).toBe('something failed')
  })

  it('ok(undefined) is a valid result', () => {
    const r = ok(undefined)
    expect(r.ok).toBe(true)
    expect(r.value).toBeUndefined()
  })
})

describe('Result - type guards', () => {
  it('isOk() returns true for Ok', () => {
    expect(isOk(ok('hello'))).toBe(true)
  })

  it('isOk() returns false for Err', () => {
    expect(isOk(err('oops'))).toBe(false)
  })

  it('isErr() returns true for Err', () => {
    expect(isErr(err(42))).toBe(true)
  })

  it('isErr() returns false for Ok', () => {
    expect(isErr(ok(42))).toBe(false)
  })
})

describe('Result - map', () => {
  it('transforms the Ok value', () => {
    const r = map(ok(5), (n) => n * 2)
    expect(isOk(r) && r.value).toBe(10)
  })

  it('passes Err through unchanged', () => {
    const errResult: Result<number, string> = err('oops')
    const r = map(errResult, (n: number) => n * 2)
    expect(isErr(r) && r.error).toBe('oops')
  })
})

describe('Result - flatMap', () => {
  it('chains Ok values', () => {
    const r = flatMap(ok(10), (n) => (n > 0 ? ok(n * 3) : err('negative')))
    expect(isOk(r) && r.value).toBe(30)
  })

  it('short-circuits on the first Err', () => {
    const r = flatMap(ok(-1), (n) => (n > 0 ? ok(n) : err('negative')))
    expect(isErr(r) && r.error).toBe('negative')
  })

  it('passes an existing Err through', () => {
    const priorErr: Result<number, string> = err('prior error')
    const r = flatMap(priorErr, (n: number) => ok(n))
    expect(isErr(r) && r.error).toBe('prior error')
  })
})

describe('Result - mapErr', () => {
  it('transforms the Err value', () => {
    const r = mapErr(err('raw error'), (e) => `WRAPPED: ${e}`)
    expect(isErr(r) && r.error).toBe('WRAPPED: raw error')
  })

  it('passes Ok through unchanged', () => {
    const r = mapErr(ok(42), (e: string) => `WRAPPED: ${e}`)
    expect(isOk(r) && r.value).toBe(42)
  })
})

describe('Result - match', () => {
  it('calls ok handler for Ok', () => {
    const msg = match(ok('data'), {
      ok: (v) => `Got: ${v}`,
      err: (e: string) => `Failed: ${e}`,
    })
    expect(msg).toBe('Got: data')
  })

  it('calls err handler for Err', () => {
    const msg = match(err('bang'), {
      ok: (v: string) => `Got: ${v}`,
      err: (e) => `Failed: ${e}`,
    })
    expect(msg).toBe('Failed: bang')
  })
})

describe('Result - unwrapOr', () => {
  it('returns the Ok value', () => {
    expect(unwrapOr(ok(7), 0)).toBe(7)
  })

  it('returns the fallback for Err', () => {
    const errResult: Result<number, string> = err('oops')
    expect(unwrapOr(errResult, 0)).toBe(0)
  })
})

describe('Result - unwrap', () => {
  it('returns value for Ok', () => {
    expect(unwrap(ok('hello'))).toBe('hello')
  })

  it('throws for Err', () => {
    expect(() => unwrap(err('oh no'))).toThrow('[Result] unwrap called on Err')
  })
})

describe('Result - unwrapErr', () => {
  it('returns error for Err', () => {
    expect(unwrapErr(err('error value'))).toBe('error value')
  })

  it('throws for Ok', () => {
    expect(() => unwrapErr(ok(42))).toThrow('[Result] unwrapErr called on Ok')
  })
})

describe('Result - combine', () => {
  it('returns Ok of array when all are Ok', () => {
    const r = combine([ok(1), ok(2), ok(3)])
    expect(isOk(r) && r.value).toEqual([1, 2, 3])
  })

  it('returns the FIRST Err when any fails', () => {
    const r = combine([ok(1), err('second'), err('third')])
    expect(isErr(r) && r.error).toBe('second')
  })

  it('returns Ok([]) for an empty array', () => {
    const r = combine([])
    expect(isOk(r) && r.value).toEqual([])
  })
})

describe('Result - combineAll', () => {
  it('returns all errors when multiple fail', () => {
    const r = combineAll([ok(1), err('a'), ok(2), err('b')])
    expect(isErr(r) && r.error).toEqual(['a', 'b'])
  })

  it('returns Ok of all values when all succeed', () => {
    const r = combineAll([ok('x'), ok('y')])
    expect(isOk(r) && r.value).toEqual(['x', 'y'])
  })
})

describe('Result - tryCatch', () => {
  it('wraps a resolved promise in Ok', async () => {
    const r = await tryCatch(
      async () => 'success',
      (e) => String(e),
    )
    expect(isOk(r) && r.value).toBe('success')
  })

  it('wraps a rejected promise in Err using the mapper', async () => {
    const r = await tryCatch(
      async () => { throw new Error('boom') },
      (e) => (e instanceof Error ? e.message : 'unknown'),
    )
    expect(isErr(r) && r.error).toBe('boom')
  })
})

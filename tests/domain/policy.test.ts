import { describe, expect, it } from 'vitest'
import { shouldRetryFailure } from '../../src/domain/policy'

describe('shouldRetryFailure', () => {
  it('never retries success outcomes', () => {
    expect(
      shouldRetryFailure('success', 0, {
        retryOn: 'any',
      }),
    ).toBe(false)

    expect(
      shouldRetryFailure('success', 0, {
        retryOn: 'error',
      }),
    ).toBe(false)

    expect(
      shouldRetryFailure('success', 0, {
        retryOn: 'timeout',
      }),
    ).toBe(false)
  })

  it('retries error and timeout when policy is any', () => {
    expect(
      shouldRetryFailure('error', 1, {
        retryOn: 'any',
      }),
    ).toBe(true)

    expect(
      shouldRetryFailure('timeout', null, {
        retryOn: 'any',
      }),
    ).toBe(true)
  })

  it('retries only timeout when policy is timeout', () => {
    expect(
      shouldRetryFailure('error', 1, {
        retryOn: 'timeout',
      }),
    ).toBe(false)

    expect(
      shouldRetryFailure('timeout', null, {
        retryOn: 'timeout',
      }),
    ).toBe(true)
  })

  it('retries only error when policy is error', () => {
    expect(
      shouldRetryFailure('error', 1, {
        retryOn: 'error',
      }),
    ).toBe(true)

    expect(
      shouldRetryFailure('timeout', null, {
        retryOn: 'error',
      }),
    ).toBe(false)
  })

  it('applies exit-code filter for error outcomes', () => {
    expect(
      shouldRetryFailure('error', 7, {
        retryOn: 'any',
        retryOnExitCodes: new Set([7, 9]),
      }),
    ).toBe(true)

    expect(
      shouldRetryFailure('error', 2, {
        retryOn: 'any',
        retryOnExitCodes: new Set([7, 9]),
      }),
    ).toBe(false)

    expect(
      shouldRetryFailure('error', null, {
        retryOn: 'any',
        retryOnExitCodes: new Set([7, 9]),
      }),
    ).toBe(false)
  })

  it('handles exhaustive check for invalid outcome', () => {
    // We intentionally pass an invalid outcome to test the exhaustiveness default case
    const invalidOutcome =
      'invalid' as unknown as import('../../src/domain/policy').AttemptOutcome

    expect(() =>
      shouldRetryFailure(invalidOutcome, 0, {
        retryOn: 'any',
      }),
    ).toThrow('Unexpected outcome: invalid')
  })
})

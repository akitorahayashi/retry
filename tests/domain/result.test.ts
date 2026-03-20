import { describe, expect, it } from 'vitest'
import { toFinalResult } from '../../src/domain/result'

describe('toFinalResult', () => {
  it('maps attempt result to successful final result', () => {
    expect(
      toFinalResult({
        attempt: 2,
        outcome: 'success',
        exitCode: 0,
      }),
    ).toEqual({
      attempts: 2,
      finalExitCode: 0,
      finalOutcome: 'success',
      succeeded: true,
    })
  })

  it('maps timeout as non-successful final result', () => {
    expect(
      toFinalResult({
        attempt: 3,
        outcome: 'timeout',
        exitCode: null,
      }),
    ).toEqual({
      attempts: 3,
      finalExitCode: null,
      finalOutcome: 'timeout',
      succeeded: false,
    })
  })
})

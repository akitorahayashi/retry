import { describe, expect, it } from 'vitest'
import { toFinalResult } from '../../src/domain/result'

describe('toFinalResult', () => {
  it('maps attempt result to successful final result', () => {
    expect(
      toFinalResult({
        attempt: 2,
        outcome: 'success',
        exitCode: 0,
        stdout: '{"ok":true}',
      }),
    ).toEqual({
      attempts: 2,
      exitCode: 0,
      outcome: 'success',
      stdout: '{"ok":true}',
    })
  })

  it('maps timeout as non-successful final result', () => {
    expect(
      toFinalResult({
        attempt: 3,
        outcome: 'timeout',
        exitCode: null,
        stdout: '',
      }),
    ).toEqual({
      attempts: 3,
      exitCode: null,
      outcome: 'timeout',
      stdout: '',
    })
  })

  it('maps error as non-successful final result', () => {
    expect(
      toFinalResult({
        attempt: 1,
        outcome: 'error',
        exitCode: 17,
        stdout: '',
      }),
    ).toEqual({
      attempts: 1,
      exitCode: 17,
      outcome: 'error',
      stdout: '',
    })
  })
})

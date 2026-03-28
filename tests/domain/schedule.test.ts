import { describe, expect, it } from 'vitest'
import { resolveAttemptDelaySeconds } from '../../src/domain/schedule'

describe('resolveAttemptDelaySeconds', () => {
  it('uses schedule value for matching attempt', () => {
    expect(
      resolveAttemptDelaySeconds(1, {
        retryDelaySeconds: 10,
        retryDelayScheduleSeconds: [2, 4],
      }),
    ).toBe(2)
  })

  it('falls back to default delay when schedule has no value', () => {
    expect(
      resolveAttemptDelaySeconds(3, {
        retryDelaySeconds: 10,
        retryDelayScheduleSeconds: [2, 4],
      }),
    ).toBe(10)
  })
})

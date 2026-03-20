import { describe, expect, it } from 'vitest'
import { resolveRetryDelaySeconds } from '../../src/domain/schedule'

describe('resolveRetryDelaySeconds', () => {
  it('uses schedule value for matching retry index', () => {
    expect(
      resolveRetryDelaySeconds(1, {
        defaultDelaySeconds: 10,
        retryDelayScheduleSeconds: [2, 4],
      }),
    ).toBe(2)
  })

  it('falls back to default delay when schedule has no value', () => {
    expect(
      resolveRetryDelaySeconds(3, {
        defaultDelaySeconds: 10,
        retryDelayScheduleSeconds: [2, 4],
      }),
    ).toBe(10)
  })
})

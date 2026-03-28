import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { delay } from '../../src/adapters/delay'

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the specified milliseconds', async () => {
    const { promise } = delay(1000)
    let resolved = false
    promise.then(() => {
      resolved = true
    })

    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(500)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(500)
    expect(resolved).toBe(true)
  })

  it('cancels the timeout when cancel is called', async () => {
    const { promise, cancel } = delay(1000)
    let resolved = false
    promise.then(() => {
      resolved = true
    })

    cancel()

    await vi.advanceTimersByTimeAsync(1500)
    expect(resolved).toBe(false)
  })
})

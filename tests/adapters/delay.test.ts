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

  it('resolves immediately for 0 milliseconds', async () => {
    const { promise } = delay(0)
    let resolved = false
    promise.then(() => {
      resolved = true
    })

    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(0)
    expect(resolved).toBe(true)
  })

  it('does nothing when cancel is called after resolution', async () => {
    const { promise, cancel } = delay(100)
    let resolved = false
    promise.then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(100)
    expect(resolved).toBe(true)

    cancel()
    await vi.advanceTimersByTimeAsync(100)
    expect(resolved).toBe(true)
  })
})

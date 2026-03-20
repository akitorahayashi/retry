import { describe, expect, it, vi } from 'vitest'
import type { RunningCommand } from '../../src/adapters/run-shell-command'
import { executeRetry } from '../../src/app/execute-retry'
import type { RetryRequest } from '../../src/action/read-inputs'

function createRequest(overrides?: Partial<RetryRequest>): RetryRequest {
  return {
    command: 'echo test',
    maxAttempts: 3,
    shell: 'bash',
    timeoutSeconds: undefined,
    retryDelaySeconds: 0,
    retryDelayScheduleSeconds: [],
    retryOn: 'any',
    retryOnExitCodes: undefined,
    continueOnError: false,
    terminationGraceSeconds: 1,
    ...overrides,
  }
}

function completed(exitCode: number | null): RunningCommand {
  return {
    pid: 100,
    completion: Promise.resolve({ exitCode }),
    isRunning: () => false,
  }
}

describe('executeRetry', () => {
  it('stops when one attempt succeeds', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(1))
      .mockReturnValueOnce(completed(0))

    const result = await executeRetry(createRequest(), {
      runCommand,
      delay: vi
        .fn()
        .mockReturnValue({ promise: new Promise(() => {}), cancel: vi.fn() }),
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    })

    expect(runCommand).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      attempts: 2,
      finalExitCode: 0,
      finalOutcome: 'success',
      succeeded: true,
    })
  })

  it('stops without retry when policy excludes error failures', async () => {
    const runCommand = vi.fn().mockReturnValue(completed(9))

    const result = await executeRetry(createRequest({ retryOn: 'timeout' }), {
      runCommand,
      delay: vi
        .fn()
        .mockReturnValue({ promise: new Promise(() => {}), cancel: vi.fn() }),
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    })

    expect(runCommand).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      attempts: 1,
      finalExitCode: 9,
      finalOutcome: 'error',
      succeeded: false,
    })
  })

  it('retries only configured exit codes when filter is provided', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(2))
      .mockReturnValueOnce(completed(3))

    const result = await executeRetry(
      createRequest({ retryOnExitCodes: new Set([2, 7]) }),
      {
        runCommand,
        delay: vi
          .fn()
          .mockReturnValue({ promise: new Promise(() => {}), cancel: vi.fn() }),
        sleep: vi.fn().mockResolvedValue(undefined),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(runCommand).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      attempts: 2,
      finalExitCode: 3,
      finalOutcome: 'error',
      succeeded: false,
    })
  })

  it('returns timeout outcome and terminates process tree when timeout wins race', async () => {
    let resolveCompletion: (value: { exitCode: number | null }) => void
    const completion = new Promise<{ exitCode: number | null }>((resolve) => {
      resolveCompletion = resolve
    })
    const runCommand = vi.fn().mockReturnValue({
      pid: 123,
      completion,
      isRunning: () => true,
    })

    const terminateProcessTree = vi.fn().mockImplementation(async () => {
      resolveCompletion({ exitCode: null }) // Simulate process termination unblocking the command completion
    })

    const result = await executeRetry(
      createRequest({ timeoutSeconds: 5, maxAttempts: 1 }),
      {
        runCommand,
        delay: vi
          .fn()
          .mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() }),
        sleep: vi.fn().mockResolvedValue(undefined),
        terminateProcessTree,
      },
    )

    expect(terminateProcessTree).toHaveBeenCalledWith(123, 1)
    expect(result.finalOutcome).toBe('timeout')
    expect(result.succeeded).toBe(false)
  })

  it('cancels timer when command completes before timeout', async () => {
    const runCommand = vi.fn().mockReturnValue(completed(0))
    const cancelFn = vi.fn()

    const result = await executeRetry(
      createRequest({ timeoutSeconds: 5, maxAttempts: 1 }),
      {
        runCommand,
        delay: vi.fn().mockReturnValue({
          promise: new Promise(() => {}), // Never times out
          cancel: cancelFn,
        }),
        sleep: vi.fn().mockResolvedValue(undefined),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(cancelFn).toHaveBeenCalled()
    expect(result.finalOutcome).toBe('success')
    expect(result.succeeded).toBe(true)
  })

  it('applies scheduled retry delay values ahead of fixed delay', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(1))
      .mockReturnValueOnce(completed(2))
      .mockReturnValueOnce(completed(3))

    const sleepFn = vi.fn().mockResolvedValue(undefined)

    const result = await executeRetry(
      createRequest({
        retryDelaySeconds: 10,
        retryDelayScheduleSeconds: [1, 5],
      }),
      {
        runCommand,
        delay: vi
          .fn()
          .mockReturnValue({ promise: new Promise(() => {}), cancel: vi.fn() }),
        sleep: sleepFn,
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000)
    expect(sleepFn).toHaveBeenNthCalledWith(2, 5000)
    expect(result.attempts).toBe(3)
  })
})

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
  it('terminates process tree and times out when command execution exceeds timeoutSeconds', async () => {
    vi.useFakeTimers()

    let resolveCompletion: (value: { exitCode: number | null }) => void
    const completionPromise = new Promise<{ exitCode: number | null }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const terminateProcessTree = vi.fn().mockResolvedValue(undefined)
    const runCommand = vi.fn().mockReturnValue({
      pid: 100,
      completion: completionPromise,
      isRunning: () => true,
    })

    const request = createRequest({
      maxAttempts: 1,
      timeoutSeconds: 5,
      terminationGraceSeconds: 2,
    })

    const resultPromise = executeRetry(request, {
      runCommand,
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree,
    })

    // Advance time to trigger the timeout
    await vi.advanceTimersByTimeAsync(5000)

    expect(terminateProcessTree).toHaveBeenCalledWith(100, 2)

    // Simulate process termination by resolving the completion promise
    resolveCompletion?.({ exitCode: null })

    const result = await resultPromise
    expect(result).toEqual({
      attempts: 1,
      finalExitCode: null,
      finalOutcome: 'timeout',
      succeeded: false,
    })

    vi.useRealTimers()
  })

  it('interrupts running command and terminates process tree on SIGTERM', async () => {
    const processOnceSpy = vi
      .spyOn(process, 'once')
      .mockImplementation(() => process)
    const processOffSpy = vi
      .spyOn(process, 'off')
      .mockImplementation(() => process)

    let resolveCompletion: (value: { exitCode: number | null }) => void
    const completionPromise = new Promise<{ exitCode: number | null }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const terminateProcessTree = vi.fn().mockResolvedValue(undefined)
    const runCommand = vi.fn().mockReturnValue({
      pid: 200,
      completion: completionPromise,
      isRunning: () => true,
    })

    const request = createRequest({
      maxAttempts: 1,
      terminationGraceSeconds: 3,
    })

    const resultPromise = executeRetry(request, {
      runCommand,
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree,
    })

    // Find and trigger the SIGTERM handler
    const sigtermCall = processOnceSpy.mock.calls.find(
      (call) => call[0] === 'SIGTERM',
    )
    expect(sigtermCall).toBeDefined()
    const sigtermHandler = sigtermCall?.[1] as () => void

    // Simulate receiving SIGTERM
    sigtermHandler()

    // terminateProcessTree is async inside the signal handler so wait for microtasks
    await vi.waitFor(() => {
      expect(terminateProcessTree).toHaveBeenCalledWith(200, 3)
    })

    // Resolve to let the execution finish
    resolveCompletion?.({ exitCode: null })
    await resultPromise

    // Verify cleanup
    expect(processOffSpy).toHaveBeenCalledWith('SIGTERM', sigtermHandler)
    expect(processOffSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function))
  })

  it('interrupts running command and terminates process tree on SIGINT', async () => {
    const processOnceSpy = vi
      .spyOn(process, 'once')
      .mockImplementation(() => process)
    const processOffSpy = vi
      .spyOn(process, 'off')
      .mockImplementation(() => process)

    let resolveCompletion: (value: { exitCode: number | null }) => void
    const completionPromise = new Promise<{ exitCode: number | null }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const terminateProcessTree = vi.fn().mockResolvedValue(undefined)
    const runCommand = vi.fn().mockReturnValue({
      pid: 201,
      completion: completionPromise,
      isRunning: () => true,
    })

    const request = createRequest({
      maxAttempts: 1,
      terminationGraceSeconds: 3,
    })

    const resultPromise = executeRetry(request, {
      runCommand,
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree,
    })

    // Find and trigger the SIGINT handler
    const sigintCall = processOnceSpy.mock.calls.find(
      (call) => call[0] === 'SIGINT',
    )
    expect(sigintCall).toBeDefined()
    const sigintHandler = sigintCall?.[1] as () => void

    // Simulate receiving SIGINT
    sigintHandler()

    // terminateProcessTree is async inside the signal handler so wait for microtasks
    await vi.waitFor(() => {
      expect(terminateProcessTree).toHaveBeenCalledWith(201, 3)
    })

    // Resolve to let the execution finish
    resolveCompletion?.({ exitCode: null })
    await resultPromise

    // Verify cleanup
    expect(processOffSpy).toHaveBeenCalledWith('SIGINT', sigintHandler)
    expect(processOffSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
  })

  it('stops when one attempt succeeds', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(1))
      .mockReturnValueOnce(completed(0))

    const result = await executeRetry(createRequest(), {
      runCommand,
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
        sleep: sleepFn,
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000)
    expect(sleepFn).toHaveBeenNthCalledWith(2, 5000)
    expect(result.attempts).toBe(3)
  })
})

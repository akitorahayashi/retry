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

function createNeverDelay() {
  return {
    promise: new Promise<void>(() => {}),
    cancel: vi.fn(),
  }
}

describe('executeRetry', () => {
  it('returns timeout and terminates process tree when timeout wins', async () => {
    let resolveCompletion!: (value: { exitCode: number | null }) => void
    const completionPromise = new Promise<{ exitCode: number | null }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const terminateProcessTree = vi.fn().mockImplementation(async () => {
      resolveCompletion({ exitCode: null })
    })
    const runCommand = vi.fn().mockReturnValue({
      pid: 100,
      completion: completionPromise,
      isRunning: () => true,
    })

    const result = await executeRetry(
      createRequest({
        maxAttempts: 1,
        timeoutSeconds: 5,
        terminationGraceSeconds: 2,
      }),
      {
        runCommand,
        delay: vi.fn().mockReturnValue({
          promise: Promise.resolve(),
          cancel: vi.fn(),
        }),
        sleep: vi.fn().mockResolvedValue(undefined),
        terminateProcessTree,
      },
    )

    expect(terminateProcessTree).toHaveBeenCalledWith(100, 2)
    expect(result).toEqual({
      attempts: 1,
      finalExitCode: null,
      finalOutcome: 'timeout',
      succeeded: false,
    })
  })

  it.each([
    { signal: 'SIGTERM' as const, pid: 200 },
    { signal: 'SIGINT' as const, pid: 201 },
  ])('interrupts running command and terminates process tree on $signal', async ({
    signal,
    pid,
  }) => {
    const processOnceSpy = vi
      .spyOn(process, 'once')
      .mockImplementation(() => process)
    const processOffSpy = vi
      .spyOn(process, 'off')
      .mockImplementation(() => process)

    let resolveCompletion!: (value: { exitCode: number | null }) => void
    const completionPromise = new Promise<{ exitCode: number | null }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const terminateProcessTree = vi.fn().mockResolvedValue(undefined)
    const runCommand = vi.fn().mockReturnValue({
      pid,
      completion: completionPromise,
      isRunning: () => true,
    })

    const resultPromise = executeRetry(createRequest({ maxAttempts: 1 }), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
      sleep: vi.fn().mockResolvedValue(undefined),
      terminateProcessTree,
    })

    const signalCall = processOnceSpy.mock.calls.find(
      (call) => call[0] === signal,
    )
    expect(signalCall).toBeDefined()
    const signalHandler = signalCall?.[1] as () => void

    signalHandler()

    await vi.waitFor(() => {
      expect(terminateProcessTree).toHaveBeenCalledWith(pid, 1)
    })

    resolveCompletion({ exitCode: null })
    await resultPromise

    const otherSignal = signal === 'SIGTERM' ? 'SIGINT' : 'SIGTERM'
    expect(processOffSpy).toHaveBeenCalledWith(signal, signalHandler)
    expect(processOffSpy).toHaveBeenCalledWith(
      otherSignal,
      expect.any(Function),
    )
  })

  it('stops when one attempt succeeds', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(1))
      .mockReturnValueOnce(completed(0))

    const result = await executeRetry(createRequest(), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
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
      delay: vi.fn().mockReturnValue(createNeverDelay()),
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
        delay: vi.fn().mockReturnValue(createNeverDelay()),
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
        delay: vi.fn().mockReturnValue(createNeverDelay()),
        sleep: sleepFn,
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000)
    expect(sleepFn).toHaveBeenNthCalledWith(2, 5000)
    expect(result.attempts).toBe(3)
  })

  it('treats synchronous errors in runCommand as error outcome and retries', async () => {
    const runCommand = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('spawn failed')
      })
      .mockReturnValueOnce(completed(0))

    const result = await executeRetry(createRequest({ maxAttempts: 2 }), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
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

  it('treats promise rejections in runCommand completion as error outcome and retries', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce({
        pid: 101,
        completion: Promise.reject(new Error('process crashed')),
        isRunning: () => false,
      })
      .mockReturnValueOnce(completed(0))

    const result = await executeRetry(createRequest({ maxAttempts: 2 }), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
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
})

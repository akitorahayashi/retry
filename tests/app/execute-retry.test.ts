import { describe, expect, it, vi } from 'vitest'
import type { RunningCommand } from '../../src/adapters/run-shell-command'
import {
  executeRetry,
  type ExecuteRetryRequest,
} from '../../src/app/execute-retry'

interface ExecuteRetryRequestOverrides {
  maxAttempts?: ExecuteRetryRequest['maxAttempts']
  command?: Partial<ExecuteRetryRequest['command']>
  policy?: Partial<ExecuteRetryRequest['policy']>
  schedule?: Partial<ExecuteRetryRequest['schedule']>
}

function createRequest(
  overrides?: ExecuteRetryRequestOverrides,
): ExecuteRetryRequest {
  const defaultCommand = {
    command: 'echo test',
    shell: 'bash',
    timeoutSeconds: undefined,
    terminationGraceSeconds: 1,
    ...(overrides?.command || {}),
  }

  const defaultPolicy = {
    retryOn: 'any' as const,
    retryOnExitCodes: undefined,
    ...(overrides?.policy || {}),
  }

  const defaultSchedule = {
    retryDelaySeconds: 0,
    retryDelayScheduleSeconds: [],
    ...(overrides?.schedule || {}),
  }

  return {
    maxAttempts: overrides?.maxAttempts ?? 3,
    command: defaultCommand,
    policy: defaultPolicy,
    schedule: defaultSchedule,
  }
}

function completed(exitCode: number | null, stdout = ''): RunningCommand {
  return {
    pid: 100,
    completion: Promise.resolve({ exitCode, stdout }),
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
  it('throws an error when finalAttempt is missing', async () => {
    // We mock the maxAttempts property so it passes the integer validation
    // but the loop does not run. We need to mock it returning > 0 for validation
    // and > 0 for `request.maxAttempts > 0` check.
    const request = createRequest({ maxAttempts: 1 })
    Object.defineProperty(request, 'maxAttempts', {
      get: vi
        .fn()
        .mockReturnValueOnce(1) // Number.isInteger check
        .mockReturnValueOnce(1) // <= 0 check
        .mockReturnValueOnce(0), // for loop condition check
    })

    await expect(
      executeRetry(request, {
        runCommand: vi.fn(),
        delay: vi.fn(),
        terminateProcessTree: vi.fn(),
      }),
    ).rejects.toThrow('Retry execution did not produce an attempt result.')
  })

  it.each([
    0, -1, 1.5,
  ])('throws an error when maxAttempts is invalid (%s)', async (invalidMaxAttempts) => {
    await expect(
      executeRetry(createRequest({ maxAttempts: invalidMaxAttempts }), {
        runCommand: vi.fn(),
        delay: vi.fn(),
        terminateProcessTree: vi.fn(),
      }),
    ).rejects.toThrow(
      `ExecuteRetryRequest.maxAttempts must be a positive integer, but received: ${invalidMaxAttempts}`,
    )
  })

  it('returns timeout and terminates process tree when timeout wins', async () => {
    let resolveCompletion!: (value: {
      exitCode: number | null
      stdout: string
    }) => void
    const completionPromise = new Promise<{
      exitCode: number | null
      stdout: string
    }>((resolve) => {
      resolveCompletion = resolve
    })

    const terminateProcessTree = vi.fn().mockImplementation(async () => {
      resolveCompletion({ exitCode: null, stdout: '' })
    })
    const runCommand = vi.fn().mockReturnValue({
      pid: 100,
      completion: completionPromise,
      isRunning: () => true,
    })

    const result = await executeRetry(
      createRequest({
        maxAttempts: 1,
        command: {
          timeoutSeconds: 5,
          terminationGraceSeconds: 2,
        },
      }),
      {
        runCommand,
        delay: vi.fn().mockReturnValue({
          promise: Promise.resolve(),
          cancel: vi.fn(),
        }),
        terminateProcessTree,
      },
    )

    expect(terminateProcessTree).toHaveBeenCalledWith(100, 2)
    expect(result).toEqual({
      attempts: 1,
      finalExitCode: null,
      finalOutcome: 'timeout',
      succeeded: false,
      finalStdout: '',
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
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    let resolveCompletion!: (value: {
      exitCode: number | null
      stdout: string
    }) => void
    const completionPromise = new Promise<{
      exitCode: number | null
      stdout: string
    }>((resolve) => {
      resolveCompletion = resolve
    })

    const terminateProcessTree = vi.fn().mockResolvedValue(undefined)
    const runCommand = vi.fn().mockReturnValue({
      pid,
      completion: completionPromise,
      isRunning: () => true,
    })

    const resultPromise = executeRetry(createRequest({ maxAttempts: 1 }), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
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

    resolveCompletion({ exitCode: null, stdout: '' })
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
      .mockReturnValueOnce(completed(1, 'first attempt\n'))
      .mockReturnValueOnce(completed(0, '{"ok":true}'))

    const result = await executeRetry(createRequest(), {
      runCommand,
      delay: vi.fn().mockReturnValue(createNeverDelay()),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    })

    expect(runCommand).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      attempts: 2,
      finalExitCode: 0,
      finalOutcome: 'success',
      succeeded: true,
      finalStdout: '{"ok":true}',
    })
  })

  it('stops without retry when policy excludes error failures', async () => {
    const runCommand = vi.fn().mockReturnValue(completed(9))

    const result = await executeRetry(
      createRequest({ policy: { retryOn: 'timeout' } }),
      {
        runCommand,
        delay: vi.fn().mockReturnValue(createNeverDelay()),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(runCommand).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      attempts: 1,
      finalExitCode: 9,
      finalOutcome: 'error',
      succeeded: false,
      finalStdout: '',
    })
  })

  it('retries only configured exit codes when filter is provided', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(2))
      .mockReturnValueOnce(completed(3))

    const result = await executeRetry(
      createRequest({ policy: { retryOnExitCodes: new Set([2, 7]) } }),
      {
        runCommand,
        delay: vi.fn().mockReturnValue(createNeverDelay()),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(runCommand).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      attempts: 2,
      finalExitCode: 3,
      finalOutcome: 'error',
      succeeded: false,
      finalStdout: '',
    })
  })

  it('applies scheduled retry delay values ahead of fixed delay', async () => {
    const runCommand = vi
      .fn()
      .mockReturnValueOnce(completed(1))
      .mockReturnValueOnce(completed(2))
      .mockReturnValueOnce(completed(3))

    const delayFn = vi.fn().mockImplementation((ms) => {
      // If ms is not a small sleep, it's likely a timeout or not our expected sleep
      if (ms === 1000 || ms === 5000 || ms === 10000) {
        return {
          promise: Promise.resolve(),
          cancel: vi.fn(),
        }
      }
      return createNeverDelay()
    })

    const result = await executeRetry(
      createRequest({
        schedule: {
          retryDelaySeconds: 10,
          retryDelayScheduleSeconds: [1, 5],
        },
      }),
      {
        runCommand,
        delay: delayFn,
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      },
    )

    expect(delayFn).toHaveBeenNthCalledWith(1, 1000)
    expect(delayFn).toHaveBeenNthCalledWith(2, 5000)
    expect(result.attempts).toBe(3)
  })

  it('escalates synchronous errors from runCommand', async () => {
    const runCommand = vi.fn().mockImplementationOnce(() => {
      throw new Error('spawn failed')
    })

    await expect(
      executeRetry(createRequest({ maxAttempts: 2 }), {
        runCommand,
        delay: vi.fn().mockReturnValue(createNeverDelay()),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow('spawn failed')

    expect(runCommand).toHaveBeenCalledTimes(1)
  })

  it('escalates promise rejections from runCommand completion', async () => {
    const runCommand = vi.fn().mockReturnValueOnce({
      pid: 101,
      completion: Promise.reject(new Error('process crashed')),
      isRunning: () => false,
    })

    await expect(
      executeRetry(createRequest({ maxAttempts: 2 }), {
        runCommand,
        delay: vi.fn().mockReturnValue(createNeverDelay()),
        terminateProcessTree: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow('process crashed')

    expect(runCommand).toHaveBeenCalledTimes(1)
  })
})

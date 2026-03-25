import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  awaitAttemptOutcome,
  logAttemptCompletion,
} from '../../src/app/execute-retry/await-attempt-outcome'
import * as core from '@actions/core'
import type { RunningCommand } from '../../src/adapters/run-shell-command'
import type { CommandSpec } from '../../src/domain/command'

describe('awaitAttemptOutcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success when process completes without timeout', async () => {
    const command: CommandSpec = {
      command: 'echo "test"',
      shell: 'bash',
      timeoutSeconds: undefined,
      terminationGraceSeconds: 5,
    }
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: 'ok\n' }),
    }
    const dependencies = {
      delay: vi.fn(),
      terminateProcessTree: vi.fn(),
    }

    const result = await awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )
    expect(result).toEqual({ outcome: 'success', exitCode: 0, stdout: 'ok\n' })
    expect(dependencies.delay).not.toHaveBeenCalled()
  })

  it('returns error when process completes with non-zero exit code without timeout', async () => {
    const command: CommandSpec = {
      command: 'exit 1',
      shell: 'bash',
      timeoutSeconds: undefined,
      terminationGraceSeconds: 5,
    }
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 1, stdout: 'failed\n' }),
    }
    const dependencies = {
      delay: vi.fn(),
      terminateProcessTree: vi.fn(),
    }

    const result = await awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )
    expect(result).toEqual({
      outcome: 'error',
      exitCode: 1,
      stdout: 'failed\n',
    })
    expect(dependencies.delay).not.toHaveBeenCalled()
  })

  it('returns success when process completes before timeout', async () => {
    const command: CommandSpec = {
      command: 'echo "test"',
      shell: 'bash',
      timeoutSeconds: 10,
      terminationGraceSeconds: 5,
    }
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: '{"ok":true}' }),
    }
    const cancelTimeout = vi.fn()

    // Create a resolvable promise to represent a delay that never triggered before completion
    let resolveDelay!: () => void
    const delayPromise = new Promise<void>((resolve) => {
      resolveDelay = resolve
    })

    const dependencies = {
      delay: vi.fn().mockReturnValue({
        promise: delayPromise,
        cancel: cancelTimeout,
      }),
      terminateProcessTree: vi.fn(),
    }

    const resultPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    // Resolve delay to ensure test cleans up even though completion is faster
    resolveDelay()

    const result = await resultPromise

    expect(result).toEqual({
      outcome: 'success',
      exitCode: 0,
      stdout: '{"ok":true}',
    })
    expect(cancelTimeout).toHaveBeenCalled()
    expect(dependencies.terminateProcessTree).not.toHaveBeenCalled()
  })

  it('terminates process tree when timeout is reached', async () => {
    const command: CommandSpec = {
      command: 'sleep 10',
      shell: 'bash',
      timeoutSeconds: 1,
      terminationGraceSeconds: 5,
    }
    let resolveCompletion!: (value: {
      exitCode: number
      stdout: string
    }) => void
    const completionPromise = new Promise<{ exitCode: number; stdout: string }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: completionPromise,
    }

    let resolveInitialTimeout!: () => void
    const initialTimeoutPromise = new Promise<void>((resolve) => {
      resolveInitialTimeout = resolve
    })

    const cancelInitialTimeout = vi.fn()
    const cancelTerminationTimeout = vi.fn()

    let resolveTerminationDelay!: () => void
    const terminationDelayPromise = new Promise<void>((resolve) => {
      resolveTerminationDelay = resolve
    })

    let resolveTerminateProcessTree!: () => void
    const terminateProcessTreePromise = new Promise<void>((resolve) => {
      resolveTerminateProcessTree = resolve
    })

    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          // First delay is the command timeout
          promise: initialTimeoutPromise,
          cancel: cancelInitialTimeout,
        })
        .mockReturnValueOnce({
          // Second delay is the 5000ms termination timeout
          promise: terminationDelayPromise,
          cancel: cancelTerminationTimeout,
        }),
      terminateProcessTree: vi.fn().mockImplementation(() => {
        resolveTerminateProcessTree()
        return Promise.resolve()
      }),
    }

    const attemptPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    // Trigger initial timeout
    resolveInitialTimeout()

    // Await deterministic execution of termination instead of arbitrary tick
    await terminateProcessTreePromise

    expect(dependencies.terminateProcessTree).toHaveBeenCalledWith(1234, 5)

    // Resolve the termination delay to ensure clean up
    resolveTerminationDelay()

    // Resolve the process completion
    resolveCompletion({ exitCode: 143, stdout: 'partial\n' }) // Simulate exit due to SIGTERM

    const result = await attemptPromise

    expect(result).toEqual({
      outcome: 'timeout',
      exitCode: 143,
      stdout: 'partial\n',
    })
    expect(cancelInitialTimeout).toHaveBeenCalled()
    expect(cancelTerminationTimeout).toHaveBeenCalled()
  })

  it('throws when terminateProcessTree fails with Error', async () => {
    const command: CommandSpec = {
      command: 'sleep 10',
      shell: 'bash',
      timeoutSeconds: 1,
      terminationGraceSeconds: 5,
    }

    let resolveCompletion!: (value: any) => void
    const completionPromise = new Promise<{ exitCode: number; stdout: string }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: completionPromise,
    }

    const cancelTimeout = vi.fn()
    let resolveTerminationDelay!: () => void
    const terminationDelayPromise = new Promise<void>((resolve) => {
      resolveTerminationDelay = resolve
    })

    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Trigger initial timeout immediately
          cancel: cancelTimeout,
        })
        .mockReturnValueOnce({
          promise: terminationDelayPromise, // Second delay
          cancel: vi.fn(),
        }),
      terminateProcessTree: vi.fn().mockRejectedValue(new Error('Kill failed')),
    }

    const attemptPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    await expect(attemptPromise).rejects.toThrow('Kill failed')
    expect(dependencies.terminateProcessTree).toHaveBeenCalled()

    resolveCompletion({ exitCode: 1, stdout: '' })
    resolveTerminationDelay()
  })

  it('throws when terminateProcessTree fails with a non-Error value', async () => {
    const command: CommandSpec = {
      command: 'sleep 10',
      shell: 'bash',
      timeoutSeconds: 1,
      terminationGraceSeconds: 5,
    }

    let resolveCompletion!: (value: any) => void
    const completionPromise = new Promise<{ exitCode: number; stdout: string }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: completionPromise,
    }

    let resolveTerminationDelay!: () => void
    const terminationDelayPromise = new Promise<void>((resolve) => {
      resolveTerminationDelay = resolve
    })

    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Trigger initial timeout immediately
          cancel: vi.fn(),
        })
        .mockReturnValueOnce({
          promise: terminationDelayPromise,
          cancel: vi.fn(),
        }),
      terminateProcessTree: vi.fn().mockRejectedValue('String error message'),
    }

    const attemptPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    await expect(attemptPromise).rejects.toBe('String error message')
    expect(dependencies.terminateProcessTree).toHaveBeenCalled()

    resolveCompletion({ exitCode: 1, stdout: '' })
    resolveTerminationDelay()
  })

  it('returns a safe outcome without exit code if termination fallback timeout triggers', async () => {
    const command: CommandSpec = {
      command: 'sleep 10',
      shell: 'bash',
      timeoutSeconds: 1,
      terminationGraceSeconds: 5,
    }

    let resolveCompletion!: (value: any) => void
    const completionPromise = new Promise<{ exitCode: number; stdout: string }>(
      (resolve) => {
        resolveCompletion = resolve
      },
    )

    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: completionPromise,
    }

    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Initial timeout immediately resolves
          cancel: vi.fn(),
        })
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Termination timeout immediately resolves
          cancel: vi.fn(),
        }),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    const resultPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    const result = await resultPromise

    expect(result).toEqual({ outcome: 'timeout', exitCode: null, stdout: '' })
    resolveCompletion({ exitCode: 1, stdout: '' })
  })
})

describe('logAttemptCompletion', () => {
  it('logs completion message correctly', () => {
    const coreInfoSpy = vi.spyOn(core, 'info')

    logAttemptCompletion(1, 'success', 0)
    expect(coreInfoSpy).toHaveBeenCalledWith(
      'Attempt 1 completed with outcome=success exitCode=0',
    )

    logAttemptCompletion(2, 'timeout', null)
    expect(coreInfoSpy).toHaveBeenCalledWith(
      'Attempt 2 completed with outcome=timeout exitCode=none',
    )
  })
})

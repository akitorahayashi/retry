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
    const dependencies = {
      delay: vi.fn().mockReturnValue({
        promise: new Promise(() => {}), // Never resolves so completion wins
        cancel: cancelTimeout,
      }),
      terminateProcessTree: vi.fn(),
    }

    const result = await awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )
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
          promise: new Promise(() => {}), // Never resolves so completion wins
          cancel: cancelTerminationTimeout,
        }),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    const attemptPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    // Trigger initial timeout
    resolveInitialTimeout()

    // Allow event loop to process
    await new Promise(process.nextTick)

    expect(dependencies.terminateProcessTree).toHaveBeenCalledWith(1234, 5)

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

  it('logs error when terminateProcessTree fails and continues to wait for completion', async () => {
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

    const cancelTimeout = vi.fn()
    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Trigger initial timeout immediately
          cancel: cancelTimeout,
        })
        .mockReturnValueOnce({
          promise: new Promise(() => {}), // Second delay never resolves
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

    await new Promise(process.nextTick)

    // Terminate tree failed, but we still expect to wait for the completion
    expect(dependencies.terminateProcessTree).toHaveBeenCalled()

    resolveCompletion({ exitCode: 1, stdout: 'failed\n' })

    const result = await attemptPromise
    expect(result).toEqual({
      outcome: 'timeout',
      exitCode: 1,
      stdout: 'failed\n',
    })
  })

  it('logs raw non-Error object when terminateProcessTree fails', async () => {
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

    const dependencies = {
      delay: vi
        .fn()
        .mockReturnValueOnce({
          promise: Promise.resolve(), // Trigger initial timeout immediately
          cancel: vi.fn(),
        })
        .mockReturnValueOnce({
          promise: new Promise(() => {}), // Second delay never resolves
          cancel: vi.fn(),
        }),
      terminateProcessTree: vi.fn().mockRejectedValue('String error message'),
    }

    const coreErrorSpy = vi.spyOn(core, 'error')

    const attemptPromise = awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )
    await new Promise(process.nextTick)

    resolveCompletion({ exitCode: 1, stdout: 'failed\n' })

    await attemptPromise

    expect(coreErrorSpy).toHaveBeenCalledWith(
      'Failed timeout termination pid=1234 grace=5s: String error message',
    )
  })

  it('returns a safe outcome without exit code if termination fallback timeout triggers', async () => {
    const command: CommandSpec = {
      command: 'sleep 10',
      shell: 'bash',
      timeoutSeconds: 1,
      terminationGraceSeconds: 5,
    }

    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: new Promise(() => {}), // Never completes
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

    const result = await awaitAttemptOutcome(
      command,
      1,
      runningCommand,
      dependencies,
    )

    expect(result).toEqual({ outcome: 'timeout', exitCode: null, stdout: '' })
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

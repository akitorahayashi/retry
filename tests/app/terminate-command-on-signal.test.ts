import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { registerCommandTerminationOnSignal } from '../../src/app/execute-retry/terminate-command-on-signal'
import type { RunningCommand } from '../../src/adapters/run-shell-command'

function createProcessSpies() {
  return {
    once: vi.spyOn(process, 'once').mockReturnThis(),
    off: vi.spyOn(process, 'off').mockReturnThis(),
    exit: vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null) => {
        return undefined as never
      }),
  }
}

function findSignalHandler(
  calls: ReadonlyArray<ReadonlyArray<unknown>>,
  signal: 'SIGTERM' | 'SIGINT',
): (() => void) | undefined {
  return calls.find((call) => call[0] === signal)?.[1] as
    | (() => void)
    | undefined
}

describe('registerCommandTerminationOnSignal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers handlers for SIGTERM and SIGINT', () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn(),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    const cleanup = registerCommandTerminationOnSignal(params)

    expect(processSpies.once).toHaveBeenCalledWith(
      'SIGTERM',
      expect.any(Function),
    )
    expect(processSpies.once).toHaveBeenCalledWith(
      'SIGINT',
      expect.any(Function),
    )

    cleanup()

    expect(processSpies.off).toHaveBeenCalledWith(
      'SIGTERM',
      expect.any(Function),
    )
    expect(processSpies.off).toHaveBeenCalledWith(
      'SIGINT',
      expect.any(Function),
    )
  })

  it('does nothing if no command is running', async () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn().mockReturnValue(undefined),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )
    expect(sigtermHandler).toBeDefined()

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise chain to resolve

    expect(params.terminateProcessTree).not.toHaveBeenCalled()
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGTERM', async () => {
    const processSpies = createProcessSpies()
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: '' }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockRejectedValue('String error message'),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise and catch blocks to resolve

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches non-Error outer errors in handler and exits with 1', async () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw 'String outer error'
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow outer catch block to resolve

    // The handler's catch block should have called process.exit(1)
    expect(processSpies.exit).toHaveBeenCalledWith(1)

    // Also test SIGINT throwing a non-Error outer error
    processSpies.exit.mockClear()

    const sigintHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGINT',
    )
    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })

  it('catches non-Error from terminateProcessTree and exits with 0', async () => {
    const processSpies = createProcessSpies()
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: '' }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )

    sigtermHandler?.()
    await new Promise(process.nextTick)

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGINT', async () => {
    const processSpies = createProcessSpies()
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: '' }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    registerCommandTerminationOnSignal(params)

    const sigintHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGINT',
    )

    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('catches terminateProcessTree error and exits with 0', async () => {
    const processSpies = createProcessSpies()
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0, stdout: '' }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockRejectedValue(new Error('Kill failed')),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise and catch blocks to resolve

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches outer errors in handler and exits with 1', async () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error in handler setup')
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGTERM',
    )

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow outer catch block to resolve

    // The handler's catch block should have called process.exit(1)
    expect(processSpies.exit).toHaveBeenCalledWith(1)

    processSpies.exit.mockClear()

    const sigintHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGINT',
    )
    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })
})

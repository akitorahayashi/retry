import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { registerCommandTerminationOnSignal } from '../../src/app/execute-retry/terminate-command-on-signal'
import { createRunningCommand } from '../fixtures/execute-retry-fixtures'
import {
  createProcessSpies,
  findSignalHandler,
} from '../fixtures/process-fixtures'

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
    await processSpies.exitDone

    expect(params.terminateProcessTree).not.toHaveBeenCalled()
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGTERM', async () => {
    const processSpies = createProcessSpies()
    const runningCommand = createRunningCommand(
      Promise.resolve({ exitCode: 0, stdout: '' }),
    )

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
    await processSpies.exitDone

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches non-Error outer errors in handler and exits with 1 on SIGTERM', async () => {
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
    await processSpies.exitDone

    // The handler's catch block should have called process.exit(1)
    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })

  it('catches non-Error outer errors in handler and exits with 1 on SIGINT', async () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw 'String outer error'
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigintHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGINT',
    )
    sigintHandler?.()
    await processSpies.exitDone

    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })

  it('catches non-Error from terminateProcessTree and exits with 0', async () => {
    const processSpies = createProcessSpies()
    const runningCommand = createRunningCommand(
      Promise.resolve({ exitCode: 0, stdout: '' }),
    )

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
    await processSpies.exitDone

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGINT', async () => {
    const processSpies = createProcessSpies()
    const runningCommand = createRunningCommand(
      Promise.resolve({ exitCode: 0, stdout: '' }),
    )

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
    await processSpies.exitDone

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0)
  })

  it('catches terminateProcessTree error and exits with 0', async () => {
    const processSpies = createProcessSpies()
    const runningCommand = createRunningCommand(
      Promise.resolve({ exitCode: 0, stdout: '' }),
    )

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
    await processSpies.exitDone

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(processSpies.exit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches outer errors in handler and exits with 1 on SIGTERM', async () => {
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
    await processSpies.exitDone

    // The handler's catch block should have called process.exit(1)
    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })

  it('catches outer errors in handler and exits with 1 on SIGINT', async () => {
    const processSpies = createProcessSpies()
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error in handler setup')
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigintHandler = findSignalHandler(
      processSpies.once.mock.calls,
      'SIGINT',
    )
    sigintHandler?.()
    await processSpies.exitDone

    expect(processSpies.exit).toHaveBeenCalledWith(1)
  })
})

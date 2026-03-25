import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { registerCommandTerminationOnSignal } from '../../src/app/execute-retry/terminate-command-on-signal'
import type { RunningCommand } from '../../src/adapters/run-shell-command'

describe('registerCommandTerminationOnSignal', () => {
  let mockProcessOnce: ReturnType<typeof vi.spyOn>
  let mockProcessOff: ReturnType<typeof vi.spyOn>
  let mockProcessExit: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessOnce = vi.spyOn(process, 'once').mockReturnThis()
    mockProcessOff = vi.spyOn(process, 'off').mockReturnThis()
    mockProcessExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null) => {
        return undefined as never
      })
  })

  afterEach(() => {
    mockProcessOnce.mockRestore()
    mockProcessOff.mockRestore()
    mockProcessExit.mockRestore()
  })

  it('registers handlers for SIGTERM and SIGINT', () => {
    const params = {
      getRunningCommand: vi.fn(),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    const cleanup = registerCommandTerminationOnSignal(params)

    expect(mockProcessOnce).toHaveBeenCalledWith(
      'SIGTERM',
      expect.any(Function),
    )
    expect(mockProcessOnce).toHaveBeenCalledWith('SIGINT', expect.any(Function))

    cleanup()

    expect(mockProcessOff).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
    expect(mockProcessOff).toHaveBeenCalledWith('SIGINT', expect.any(Function))
  })

  it('does nothing if no command is running', async () => {
    const params = {
      getRunningCommand: vi.fn().mockReturnValue(undefined),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined
    expect(sigtermHandler).toBeDefined()

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise chain to resolve

    expect(params.terminateProcessTree).not.toHaveBeenCalled()
    expect(mockProcessExit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGTERM', async () => {
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0 }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockRejectedValue('String error message'),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise and catch blocks to resolve

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(mockProcessExit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches non-Error outer errors in handler and exits with 1', async () => {
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw 'String outer error'
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow outer catch block to resolve

    // The handler's catch block should have called process.exit(1)
    expect(mockProcessExit).toHaveBeenCalledWith(1)

    // Also test SIGINT throwing a non-Error outer error
    mockProcessExit.mockClear()

    const sigintHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGINT',
    )?.[1] as (() => void) | undefined
    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })

  it('catches non-Error from terminateProcessTree and exits with 0', async () => {
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0 }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined

    sigtermHandler?.()
    await new Promise(process.nextTick)

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(mockProcessExit).toHaveBeenCalledWith(0)
  })

  it('terminates process tree and exits with 0 on SIGINT', async () => {
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0 }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    registerCommandTerminationOnSignal(params)

    const sigintHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGINT',
    )?.[1] as (() => void) | undefined

    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(mockProcessExit).toHaveBeenCalledWith(0)
  })

  it('catches terminateProcessTree error and exits with 0', async () => {
    const runningCommand: RunningCommand = {
      pid: 1234,
      isRunning: () => true,
      completion: Promise.resolve({ exitCode: 0 }),
    }

    const params = {
      getRunningCommand: vi.fn().mockReturnValue(runningCommand),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn().mockRejectedValue(new Error('Kill failed')),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow promise and catch blocks to resolve

    expect(params.terminateProcessTree).toHaveBeenCalledWith(1234, 5)
    expect(mockProcessExit).toHaveBeenCalledWith(0) // Inner catch block handles it
  })

  it('catches outer errors in handler and exits with 1', async () => {
    const params = {
      getRunningCommand: vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error in handler setup')
      }),
      terminationGraceSeconds: 5,
      terminateProcessTree: vi.fn(),
    }

    registerCommandTerminationOnSignal(params)

    const sigtermHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGTERM',
    )?.[1] as (() => void) | undefined

    sigtermHandler?.()
    await new Promise(process.nextTick) // Allow outer catch block to resolve

    // The handler's catch block should have called process.exit(1)
    expect(mockProcessExit).toHaveBeenCalledWith(1)

    mockProcessExit.mockClear()

    const sigintHandler = mockProcessOnce.mock.calls.find(
      (call: unknown[]) => call[0] === 'SIGINT',
    )?.[1] as (() => void) | undefined
    sigintHandler?.()
    await new Promise(process.nextTick)

    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })
})

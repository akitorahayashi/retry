import { resolve } from 'node:path'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { runShellCommand } from '../../src/adapters/run-shell-command'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return {
    ...actual,
    spawn: vi.fn(actual.spawn),
  }
})

describe('runShellCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns zero exit code when command succeeds', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/emit-stdout-and-stderr.sh',
    )

    const running = runShellCommand(`bash ${fixture}`, 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(0)
  })

  it('returns non-zero exit code when command fails', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/fail-with-exit-code.sh',
    )

    const running = runShellCommand(`bash ${fixture} 17`, 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(17)
  })

  it('throws an error if the process fails to start and has no pid', () => {
    vi.mocked(spawn).mockImplementationOnce(() => {
      // biome-ignore lint/suspicious/noExplicitAny: mocking child process return
      return { pid: undefined } as any
    })

    expect(() => runShellCommand('echo test', 'bash')).toThrow(
      'Failed to start command process.',
    )
  })

  it('throws an error if spawn itself throws', () => {
    const spawnError = new Error('spawn failed')
    vi.mocked(spawn).mockImplementationOnce(() => {
      throw spawnError
    })

    expect(() => runShellCommand('echo test', 'bash')).toThrow(spawnError)
  })

  it('rejects the completion promise if the child process emits an error', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mocking child process return
    const emitter = new EventEmitter() as any
    emitter.pid = 1234
    emitter.stdout = new EventEmitter()
    emitter.stderr = new EventEmitter()

    vi.mocked(spawn).mockImplementationOnce(() => emitter)

    const running = runShellCommand('echo test', 'bash')

    const error = new Error('async error')
    emitter.emit('error', error)

    await expect(running.completion).rejects.toThrow('async error')
    expect(running.isRunning()).toBe(false)
  })

  it('ignores exceptions when forwarding stdout fails', async () => {
    const stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => {
        throw new Error('simulated stdout write failure')
      })

    const running = runShellCommand('echo test', 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(0)
    expect(stdoutSpy).toHaveBeenCalled()
  })

  it('ignores exceptions when forwarding stderr fails', async () => {
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => {
        throw new Error('simulated stderr write failure')
      })

    const running = runShellCommand('echo test >&2', 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(0)
    expect(stderrSpy).toHaveBeenCalled()
  })
})

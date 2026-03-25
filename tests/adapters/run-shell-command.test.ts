import { resolve } from 'node:path'
import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import {
  runShellCommand,
  type SpawnFn,
} from '../../src/adapters/run-shell-command'

describe('runShellCommand', () => {
  it('returns zero exit code when command succeeds', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/emit-stdout-and-stderr.sh',
    )

    const running = runShellCommand(`bash ${fixture}`, 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(0)
    expect(completion.stdout).toContain('line on stdout')
  })

  it('returns non-zero exit code when command fails', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/fail-with-exit-code.sh',
    )

    const running = runShellCommand(`bash ${fixture} 17`, 'bash')
    const completion = await running.completion

    expect(completion.exitCode).toBe(17)
    expect(completion.stdout).toBe('failing with exit code 17\n')
  })

  it('throws an error if the process fails to start and has no pid', () => {
    const mockSpawn = vi.fn<SpawnFn>().mockImplementationOnce(() => {
      // biome-ignore lint/suspicious/noExplicitAny: mocking child process return
      return { pid: undefined } as any
    })

    expect(() => runShellCommand('echo test', 'bash', mockSpawn)).toThrow(
      'Failed to start command process.',
    )
  })

  it('throws an error if spawn itself throws', () => {
    const spawnError = new Error('spawn failed')
    const mockSpawn = vi.fn<SpawnFn>().mockImplementationOnce(() => {
      throw spawnError
    })

    expect(() => runShellCommand('echo test', 'bash', mockSpawn)).toThrow(
      spawnError,
    )
  })

  it('rejects the completion promise if the child process emits an error', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mocking child process return
    const emitter = new EventEmitter() as any
    emitter.pid = 1234
    emitter.stdout = new EventEmitter()
    emitter.stderr = new EventEmitter()

    const mockSpawn = vi.fn<SpawnFn>().mockImplementationOnce(() => emitter)

    const running = runShellCommand('echo test', 'bash', mockSpawn)

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
    expect(completion.stdout).toContain('test')
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
    expect(completion.stdout).toBe('')
    expect(stderrSpy).toHaveBeenCalled()
  })
})

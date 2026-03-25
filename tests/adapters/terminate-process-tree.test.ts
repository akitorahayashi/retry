import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { terminateProcessTree } from '../../src/adapters/terminate-process-tree'

describe('terminateProcessTree', () => {
  // Grace period constants for test clarity
  const GRACE_PERIOD_SECONDS = 5
  const GRACE_PERIOD_MS = GRACE_PERIOD_SECONDS * 1000

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('terminates long-running process by pid', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/timeout-forever.sh',
    )

    const child = spawn('bash', [fixture], {
      detached: true,
      stdio: 'ignore',
    })

    expect(typeof child.pid).toBe('number')

    const pid = child.pid as number

    const closePromise = new Promise<void>((resolve) => {
      child.on('close', () => resolve())
    })

    try {
      vi.useFakeTimers()
      const terminatePromise = terminateProcessTree(pid, GRACE_PERIOD_SECONDS)
      await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS)

      await terminatePromise
      await closePromise

      expect(isAlive(pid)).toBe(false)
    } finally {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {
        // Best-effort cleanup.
      }
    }
  })

  describe('SIGKILL escalation', () => {
    it('sends SIGKILL if process ignores SIGTERM after grace period', async () => {
      const fixture = resolve(
        process.cwd(),
        'tests/fixtures/commands/ignore-term-then-exit.sh',
      )

      const child = spawn('bash', [fixture], {
        detached: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      })

      expect(typeof child.pid).toBe('number')

      const pid = child.pid as number

      await waitForReadySignal(child)

      const closePromise = new Promise<void>((resolve) => {
        child.on('close', () => resolve())
      })

      try {
        vi.useFakeTimers()
        const terminatePromise = terminateProcessTree(pid, GRACE_PERIOD_SECONDS)
        await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS)

        await terminatePromise
        await closePromise

        expect(isAlive(pid)).toBe(false)
      } finally {
        try {
          process.kill(-pid, 'SIGKILL')
        } catch {
          // Best-effort cleanup.
        }
      }
    })
  })

  describe('fallback logic', () => {
    it('falls back to direct pid signaling when process group is not available', async () => {
      const fixture = resolve(
        process.cwd(),
        'tests/fixtures/commands/timeout-forever.sh',
      )

      const child = spawn('bash', [fixture], {
        detached: false,
        stdio: 'ignore',
      })

      expect(typeof child.pid).toBe('number')

      const pid = child.pid as number

      const originalKill = process.kill
      const killSpy = vi
        .spyOn(process, 'kill')
        .mockImplementation((targetPid, signal) => {
          if (targetPid === -pid) {
            throw new Error('ESRCH: no such process group')
          }
          return originalKill(targetPid, signal)
        })

      const closePromise = new Promise<void>((resolve) => {
        child.on('close', () => resolve())
      })

      try {
        vi.useFakeTimers()
        const terminatePromise = terminateProcessTree(pid, GRACE_PERIOD_SECONDS)
        await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS)

        await terminatePromise
        await closePromise

        expect(isAlive(pid)).toBe(false)
        expect(killSpy).toHaveBeenCalledWith(pid, 'SIGTERM')
      } finally {
        try {
          originalKill(pid, 'SIGKILL')
        } catch {
          // Best-effort cleanup.
        }
      }
    })
  })

  describe('already gone', () => {
    it('handles the case where the process has already exited during fallback', async () => {
      const fixture = resolve(
        process.cwd(),
        'tests/fixtures/commands/timeout-forever.sh',
      )

      const child = spawn('bash', [fixture], {
        detached: false,
        stdio: 'ignore',
      })

      expect(typeof child.pid).toBe('number')

      const pid = child.pid as number

      const originalKill = process.kill
      const killSpy = vi
        .spyOn(process, 'kill')
        .mockImplementation((targetPid, signal) => {
          if (targetPid === -pid) {
            throw new Error('ESRCH: no such process group')
          }
          if (targetPid === pid) {
            throw new Error('ESRCH: no such process')
          }
          return originalKill(targetPid, signal)
        })

      try {
        vi.useFakeTimers()
        const terminatePromise = terminateProcessTree(pid, GRACE_PERIOD_SECONDS)
        await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MS)

        await terminatePromise

        expect(killSpy).toHaveBeenCalled()
        expect(isAlive(pid)).toBe(false)
      } finally {
        try {
          originalKill(pid, 'SIGKILL')
        } catch {
          // Best-effort cleanup.
        }
      }
    })
  })
})

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function waitForReadySignal(
  child: ReturnType<typeof spawn>,
  signal = 'READY',
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stdout = child.stdout
    if (!stdout) {
      reject(new Error('Child process stdout is not available'))
      return
    }

    const onData = (chunk: Buffer | string) => {
      const output = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      if (!output.includes(signal)) {
        return
      }
      cleanup()
      resolve()
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onClose = (
      code: number | null,
      closedSignal: NodeJS.Signals | null,
    ) => {
      cleanup()
      reject(
        new Error(
          `Child process exited before readiness signal (code=${String(code)}, signal=${String(closedSignal)})`,
        ),
      )
    }

    const cleanup = () => {
      stdout.off('data', onData)
      child.off('error', onError)
      child.off('close', onClose)
    }

    stdout.on('data', onData)
    child.on('error', onError)
    child.on('close', onClose)
  })
}

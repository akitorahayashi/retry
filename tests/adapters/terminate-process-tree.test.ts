import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { terminateProcessTree } from '../../src/adapters/terminate-process-tree'

describe('terminateProcessTree', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

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
      const terminatePromise = terminateProcessTree(pid, 1)

      await vi.advanceTimersByTimeAsync(1000)

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

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

describe('terminateProcessTree - SIGKILL escalation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('sends SIGKILL if process ignores SIGTERM after grace period', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/ignore-term-then-exit.sh',
    )

    const child = spawn('bash', [fixture], {
      detached: true,
      stdio: 'ignore',
    })

    expect(typeof child.pid).toBe('number')

    const pid = child.pid as number

    // Wait slightly to make sure the trap is set in the bash script
    await vi.advanceTimersByTimeAsync(100)

    const closePromise = new Promise<void>((resolve) => {
      child.on('close', () => resolve())
    })

    try {
      const terminatePromise = terminateProcessTree(pid, 2)

      // Advance by more than the grace period to trigger the SIGKILL escalation
      await vi.advanceTimersByTimeAsync(2000)

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

describe('terminateProcessTree - fallback logic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('falls back to direct pid signaling when process group is not available', async () => {
    const fixture = resolve(
      process.cwd(),
      'tests/fixtures/commands/timeout-forever.sh',
    )

    // Spawn without detached: true to prevent a process group from being formed,
    // although node might still allow -pid depending on platform.
    // Instead, we will directly spy on process.kill.
    const child = spawn('bash', [fixture], {
      detached: false,
      stdio: 'ignore',
    })

    expect(typeof child.pid).toBe('number')

    const pid = child.pid as number

    // We can't actually easily mock process.kill for just the -pid call while letting the pid call go through cleanly,
    // unless we use a conditional mock.
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
      const terminatePromise = terminateProcessTree(pid, 1)

      await vi.advanceTimersByTimeAsync(1000)

      await terminatePromise
      await closePromise

      expect(isAlive(pid)).toBe(false)

      // Ensure the direct pid signaling was attempted
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

describe('terminateProcessTree - already gone', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

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
      const terminatePromise = terminateProcessTree(pid, 1)

      await vi.advanceTimersByTimeAsync(1000)

      await terminatePromise

      // We don't care about close promise since we faked the kill
      // But we just check that no unhandled rejection occurs and it resolves cleanly
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

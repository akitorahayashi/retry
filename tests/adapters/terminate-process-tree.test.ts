import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { terminateProcessTree } from '../../src/adapters/terminate-process-tree'

describe('terminateProcessTree', () => {
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

    try {
      await terminateProcessTree(pid, 1)
      await waitUntilStopped(pid, 2000)
      expect(isAlive(pid)).toBe(false)
    } finally {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {
        // Best-effort cleanup.
      }
    }
  }, 10000)
})

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitUntilStopped(pid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!isAlive(pid)) {
      return
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
  }

  throw new Error('Process did not stop within timeout window.')
}

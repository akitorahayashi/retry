import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runShellCommand } from '../../src/adapters/run-shell-command'

describe('runShellCommand', () => {
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
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { executeAttempt } from '../../src/app/execute-retry/execute-attempt'
import type { ExecuteRetryDependencies } from '../../src/app/execute-retry/execute-retry-dependencies'
import type { CommandSpec } from '../../src/domain/command'
import * as awaitAttemptOutcomeModule from '../../src/app/execute-retry/await-attempt-outcome'

// Mock awaitAttemptOutcome to simulate a success but with a null exit code
vi.mock('../../src/app/execute-retry/await-attempt-outcome', async (importOriginal) => {
  const actual = await importOriginal<typeof awaitAttemptOutcomeModule>()
  return {
    ...actual,
    awaitAttemptOutcome: vi.fn(),
  }
})

describe('executeAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an error when attempt succeeds but exitCode is null', async () => {
    const command: CommandSpec = {
      command: 'echo "test"',
      shell: 'bash',
      timeoutSeconds: undefined,
      terminationGraceSeconds: 5,
    }

    const dependencies: ExecuteRetryDependencies = {
      runCommand: vi.fn().mockReturnValue({
        pid: 1234,
        completion: Promise.resolve({ exitCode: null, stdout: '' }),
        isRunning: () => false,
      }),
      delay: vi.fn(),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(awaitAttemptOutcomeModule.awaitAttemptOutcome).mockResolvedValue({
      outcome: 'success',
      exitCode: null,
      stdout: '',
    })

    await expect(
      executeAttempt(command, 1, dependencies)
    ).rejects.toThrow('Successful attempt must include a numeric exit code.')
  })
})

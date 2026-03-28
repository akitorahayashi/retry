import { describe, expect, it, vi, beforeEach } from 'vitest'
import { executeAttempt } from '../../src/app/execute-retry/execute-attempt'
import type { ExecuteRetryDependencies } from '../../src/app/execute-retry/execute-retry-dependencies'
import type { CommandSpec } from '../../src/domain/command'
import type { AttemptResult } from '../../src/domain/result'
import * as awaitAttemptOutcomeModule from '../../src/app/execute-retry/await-attempt-outcome'

vi.mock(
  '../../src/app/execute-retry/await-attempt-outcome',
  async (importOriginal) => {
    const actual = await importOriginal<typeof awaitAttemptOutcomeModule>()
    return {
      ...actual,
      awaitAttemptOutcome: vi.fn(),
    }
  },
)

describe('executeAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the result of awaitAttemptOutcome directly', async () => {
    const command: CommandSpec = {
      command: 'echo "test"',
      shell: 'bash',
      timeoutSeconds: undefined,
      terminationGraceSeconds: 5,
    }

    const dependencies: ExecuteRetryDependencies = {
      runCommand: vi.fn().mockReturnValue({
        pid: 1234,
        completion: Promise.resolve({ exitCode: 0, stdout: 'ok\n' }),
        isRunning: () => false,
      }),
      delay: vi.fn(),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    const expectedResult: AttemptResult = {
      attempt: 1,
      outcome: 'success',
      exitCode: 0,
      stdout: 'ok\n',
    }

    vi.mocked(awaitAttemptOutcomeModule.awaitAttemptOutcome).mockResolvedValue(expectedResult)

    await expect(executeAttempt(command, 1, dependencies)).resolves.toEqual(expectedResult)
  })
})

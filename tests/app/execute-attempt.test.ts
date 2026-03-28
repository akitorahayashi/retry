import { describe, expect, it, vi, beforeEach } from 'vitest'
import { executeAttempt } from '../../src/app/execute-retry/execute-attempt'
import type { ExecuteRetryDependencies } from '../../src/app/execute-retry/execute-retry-dependencies'
import type { ExecutionResult } from '../../src/app/execute-retry/await-attempt-outcome'
import * as awaitAttemptOutcomeModule from '../../src/app/execute-retry/await-attempt-outcome'
import {
  createCommandSpec,
  createCompletedCommand,
} from '../fixtures/execute-retry-fixtures'

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

  it('coerces impossible success-with-null-exitCode into an error outcome', async () => {
    const command = createCommandSpec()

    const dependencies: ExecuteRetryDependencies = {
      runCommand: vi.fn().mockReturnValue(createCompletedCommand(null, '')),
      delay: vi.fn(),
      terminateProcessTree: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(awaitAttemptOutcomeModule.awaitAttemptOutcome).mockResolvedValue({
      outcome: 'success',
      exitCode: null,
      stdout: '',
    } as unknown as ExecutionResult)

    await expect(executeAttempt(command, 1, dependencies)).resolves.toEqual({
      attempt: 1,
      outcome: 'error',
      exitCode: null,
      stdout: '',
    })
  })
})

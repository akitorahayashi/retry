import * as core from '@actions/core'
import type { RetryPolicy } from '../../domain/policy'
import { shouldRetryFailure } from '../../domain/policy'
import type { AttemptResult, FinalResult } from '../../domain/result'
import { toFinalResult } from '../../domain/result'
import {
  resolveRetryDelaySeconds,
  type RetrySchedule,
} from '../../domain/schedule'
import {
  executeRetryDependencies,
  type ExecuteRetryDependencies,
} from './execute-retry-dependencies'
import { executeAttempt } from './execute-attempt'
import { formatExitCode } from './format-exit-code'
import type { CommandExecution } from '../../domain/command'

export interface ExecuteRetryRequest {
  command: CommandExecution
  policy: RetryPolicy
  schedule: RetrySchedule
  maxAttempts: number
}

export async function executeRetry(
  request: ExecuteRetryRequest,
  dependencies: ExecuteRetryDependencies = executeRetryDependencies,
): Promise<FinalResult> {
  if (!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0) {
    throw new Error(
      `ExecuteRetryRequest.maxAttempts must be a positive integer, but received: ${request.maxAttempts}`,
    )
  }

  const { policy, schedule } = request

  let finalAttempt: AttemptResult | undefined

  for (let attempt = 1; attempt <= request.maxAttempts; attempt += 1) {
    finalAttempt = await core.group(
      `Attempt ${attempt}/${request.maxAttempts}`,
      async () => executeAttempt(request.command, attempt, dependencies),
    )

    if (finalAttempt.outcome === 'success') {
      return toFinalResult(finalAttempt)
    }

    if (attempt === request.maxAttempts) {
      return toFinalResult(finalAttempt)
    }

    if (
      !shouldRetryFailure(finalAttempt.outcome, finalAttempt.exitCode, policy)
    ) {
      core.info(
        'Failure is outside retry policy. Stopping without additional retries.',
      )
      return toFinalResult(finalAttempt)
    }

    const delaySeconds = resolveRetryDelaySeconds(attempt, schedule)

    core.warning(
      `Attempt ${attempt} failed with ${finalAttempt.outcome} (exit code: ${formatExitCode(finalAttempt.exitCode)}). Retrying.`,
    )

    if (delaySeconds > 0) {
      core.info(`Waiting ${delaySeconds}s before next attempt.`)
      await dependencies.sleep(delaySeconds * 1000)
    }
  }

  if (!finalAttempt) {
    throw new Error('Retry execution did not produce an attempt result.')
  }

  return toFinalResult(finalAttempt)
}

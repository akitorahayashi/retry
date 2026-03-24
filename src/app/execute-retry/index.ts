import * as core from '@actions/core'
import type { RetryOn, RetryPolicy } from '../../domain/policy'
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

export interface ExecuteRetryParams {
  command: string
  maxAttempts: number
  shell: string
  timeoutSeconds?: number
  retryDelaySeconds: number
  retryDelayScheduleSeconds: readonly number[]
  retryOn: RetryOn
  retryOnExitCodes?: ReadonlySet<number>
  terminationGraceSeconds: number
}

export async function executeRetry(
  params: ExecuteRetryParams,
  dependencies: ExecuteRetryDependencies = executeRetryDependencies,
): Promise<FinalResult> {
  if (!Number.isInteger(params.maxAttempts) || params.maxAttempts <= 0) {
    throw new Error(
      `ExecuteRetryParams.maxAttempts must be a positive integer, but received: ${params.maxAttempts}`,
    )
  }

  const policy: RetryPolicy = {
    retryOn: params.retryOn,
    retryOnExitCodes: params.retryOnExitCodes,
  }

  const schedule: RetrySchedule = {
    retryDelaySeconds: params.retryDelaySeconds,
    retryDelayScheduleSeconds: params.retryDelayScheduleSeconds,
  }

  let finalAttempt: AttemptResult | undefined

  for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
    finalAttempt = await core.group(
      `Attempt ${attempt}/${params.maxAttempts}`,
      async () => executeAttempt(params, attempt, dependencies),
    )

    if (finalAttempt.outcome === 'success') {
      return toFinalResult(finalAttempt)
    }

    if (attempt >= params.maxAttempts) {
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
      await dependencies.delay(delaySeconds * 1000).promise
    }
  }

  if (!finalAttempt) {
    throw new Error('Retry execution did not produce an attempt result.')
  }

  return toFinalResult(finalAttempt)
}

import * as core from '@actions/core';
import type { CommandSpec } from '../../domain/command';
import type { RetryPolicy } from '../../domain/policy';
import { shouldRetryFailure } from '../../domain/policy';
import type { AttemptResult } from '../../domain/result';
import {
  type RetrySchedule,
  resolveRetryDelaySeconds,
} from '../../domain/schedule';
import { executeAttempt } from './execute-attempt';
import {
  type ExecuteRetryDependencies,
  executeRetryDependencies,
} from './execute-retry-dependencies';
import { formatExitCode } from './format-exit-code';

export interface ExecuteRetryRequest {
  command: CommandSpec;
  policy: RetryPolicy;
  schedule: RetrySchedule;
  maxAttempts: number;
}

export async function executeRetry(
  request: ExecuteRetryRequest,
  dependencies: ExecuteRetryDependencies = executeRetryDependencies,
): Promise<AttemptResult> {
  const { policy, schedule } = request;

  let finalAttempt: AttemptResult | undefined;

  for (let attempt = 1; attempt <= request.maxAttempts; attempt += 1) {
    finalAttempt = await core.group(
      `Attempt ${attempt}/${request.maxAttempts}`,
      async () => executeAttempt(request.command, attempt, dependencies),
    );

    if (finalAttempt.outcome === 'success') {
      return finalAttempt;
    }

    if (attempt === request.maxAttempts) {
      return finalAttempt;
    }

    if (
      !shouldRetryFailure(finalAttempt.outcome, finalAttempt.exitCode, policy)
    ) {
      core.info(
        'Failure is outside retry policy. Stopping without additional retries.',
      );
      return finalAttempt;
    }

    const delaySeconds = resolveRetryDelaySeconds(attempt, schedule);

    core.warning(
      `Attempt ${attempt} failed with ${finalAttempt.outcome} (exit code: ${formatExitCode(finalAttempt.exitCode)}). Retrying.`,
    );

    if (delaySeconds > 0) {
      core.info(`Waiting ${delaySeconds}s before next attempt.`);
      await dependencies.delay(delaySeconds * 1000).promise;
    }
  }

  if (!finalAttempt) {
    throw new Error('Retry execution did not produce an attempt result.');
  }

  return finalAttempt;
}

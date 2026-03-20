import * as core from '@actions/core'
import {
  runShellCommand,
  type RunningCommand,
} from '../adapters/run-shell-command'
import { sleep } from '../adapters/sleep'
import { terminateProcessTree } from '../adapters/terminate-process-tree'
import type { RetryRequest } from '../action/read-inputs'
import {
  shouldRetryFailure,
  type RetryPolicy,
  type AttemptOutcome,
} from '../domain/policy'
import {
  toFinalResult,
  type AttemptResult,
  type FinalResult,
} from '../domain/result'
import {
  resolveRetryDelaySeconds,
  type RetrySchedule,
} from '../domain/schedule'

interface RuntimeDependencies {
  runCommand: (command: string, shell: string) => RunningCommand
  sleep: (milliseconds: number) => Promise<void>
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

const runtimeDependencies: RuntimeDependencies = {
  runCommand: runShellCommand,
  sleep,
  terminateProcessTree,
}

export async function executeRetry(
  request: RetryRequest,
  dependencies: RuntimeDependencies = runtimeDependencies,
): Promise<FinalResult> {
  const policy: RetryPolicy = {
    retryOn: request.retryOn,
    retryOnExitCodes: request.retryOnExitCodes,
  }

  const schedule: RetrySchedule = {
    retryDelaySeconds: request.retryDelaySeconds,
    retryDelayScheduleSeconds: request.retryDelayScheduleSeconds,
  }

  let finalAttempt: AttemptResult | undefined

  for (let attempt = 1; attempt <= request.maxAttempts; attempt += 1) {
    finalAttempt = await core.group(
      `Attempt ${attempt}/${request.maxAttempts}`,
      async () => runAttempt(request, attempt, dependencies),
    )

    if (finalAttempt.outcome === 'success') {
      return toFinalResult(finalAttempt)
    }

    if (attempt >= request.maxAttempts) {
      return toFinalResult(finalAttempt)
    }

    const retryable = shouldRetryFailure(
      finalAttempt.outcome,
      finalAttempt.exitCode,
      policy,
    )

    if (!retryable) {
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

async function runAttempt(
  request: RetryRequest,
  attempt: number,
  dependencies: RuntimeDependencies,
): Promise<AttemptResult> {
  core.info(`Running command: ${request.command}`)

  const running = dependencies.runCommand(request.command, request.shell)
  let timedOut = false
  let timeoutTimer: NodeJS.Timeout | undefined

  const onSignal = async (signal: NodeJS.Signals): Promise<void> => {
    if (running.isRunning()) {
      core.warning(
        `Received ${signal}. Terminating active command process tree.`,
      )
      try {
        await dependencies.terminateProcessTree(
          running.pid,
          request.terminationGraceSeconds,
        )
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        core.error(
          `Failed to terminate process tree pid=${running.pid} grace=${request.terminationGraceSeconds}s signal=${signal}: ${message}`,
        )
      }
    }
  }

  const onSigterm = () => {
    onSignal('SIGTERM').catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      core.error(`SIGTERM handler failed: ${message}`)
    })
  }

  const onSigint = () => {
    onSignal('SIGINT').catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      core.error(`SIGINT handler failed: ${message}`)
    })
  }

  process.once('SIGTERM', onSigterm)
  process.once('SIGINT', onSigint)

  if (request.timeoutSeconds !== undefined) {
    timeoutTimer = setTimeout(() => {
      timedOut = true
      core.warning(
        `Attempt ${attempt} timed out after ${request.timeoutSeconds}s.`,
      )
      dependencies
        .terminateProcessTree(running.pid, request.terminationGraceSeconds)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          core.error(
            `Failed timeout termination pid=${running.pid} grace=${request.terminationGraceSeconds}s: ${message}`,
          )
        })
    }, request.timeoutSeconds * 1000)
  }

  try {
    const completion = await running.completion

    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
    }

    const outcome: AttemptOutcome = timedOut
      ? 'timeout'
      : completion.exitCode === 0
        ? 'success'
        : 'error'

    core.info(
      `Attempt ${attempt} completed with outcome=${outcome} exitCode=${formatExitCode(completion.exitCode)}`,
    )

    return {
      attempt,
      outcome,
      exitCode: completion.exitCode,
    }
  } finally {
    process.off('SIGTERM', onSigterm)
    process.off('SIGINT', onSigint)
  }
}

function formatExitCode(exitCode: number | null): string {
  return exitCode === null ? 'none' : String(exitCode)
}

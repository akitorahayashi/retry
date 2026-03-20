import * as core from '@actions/core'
import {
  runShellCommand,
  type RunningCommand,
} from '../adapters/run-shell-command'
import { delay } from '../adapters/delay'
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
  delay: (milliseconds: number) => {
    promise: Promise<void>
    cancel: () => void
  }
  sleep: (milliseconds: number) => Promise<void>
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

const runtimeDependencies: RuntimeDependencies = {
  runCommand: runShellCommand,
  delay,
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
    defaultDelaySeconds: request.retryDelaySeconds,
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

    const retryIndex = attempt
    const delaySeconds = resolveRetryDelaySeconds(retryIndex, schedule)

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

  let timerCancel: (() => void) | undefined

  try {
    const completionPromise = running.completion.then((completion) => ({
      type: 'completion' as const,
      completion,
    }))

    let racePromise: Promise<
      | { type: 'completion'; completion: { exitCode: number | null } }
      | { type: 'timeout' }
    > = completionPromise

    if (request.timeoutSeconds !== undefined) {
      const timer = dependencies.delay(request.timeoutSeconds * 1000)
      timerCancel = timer.cancel

      const timeoutPromise = timer.promise.then(() => ({
        type: 'timeout' as const,
      }))

      racePromise = Promise.race([completionPromise, timeoutPromise])
    }

    const result = await racePromise

    if (result.type === 'timeout') {
      core.warning(
        `Attempt ${attempt} timed out after ${request.timeoutSeconds}s.`,
      )

      try {
        await dependencies.terminateProcessTree(
          running.pid,
          request.terminationGraceSeconds,
        )
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        core.error(
          `Failed timeout termination pid=${running.pid} grace=${request.terminationGraceSeconds}s: ${message}`,
        )
      }

      const completion = await running.completion

      return {
        attempt,
        outcome: 'timeout',
        exitCode: completion.exitCode,
      }
    }

    const outcome: AttemptOutcome =
      result.completion.exitCode === 0 ? 'success' : 'error'

    core.info(
      `Attempt ${attempt} completed with outcome=${outcome} exitCode=${formatExitCode(result.completion.exitCode)}`,
    )

    return {
      attempt,
      outcome,
      exitCode: result.completion.exitCode,
    }
  } finally {
    if (timerCancel) {
      timerCancel()
    }
    process.off('SIGTERM', onSigterm)
    process.off('SIGINT', onSigint)
  }
}

function formatExitCode(exitCode: number | null): string {
  return exitCode === null ? 'none' : String(exitCode)
}

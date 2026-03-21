import * as core from '@actions/core'
import {
  runShellCommand,
  type RunningCommand,
} from '../adapters/run-shell-command'
import { delay } from '../adapters/delay'
import { sleep } from '../adapters/sleep'
import { terminateProcessTree } from '../adapters/terminate-process-tree'
import type { CommandExecution } from '../domain/command'
import {
  shouldRetryFailure,
  type RetryPolicy,
  type AttemptOutcome,
  type RetryOn,
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

const runtimeDependencies: RuntimeDependencies = {
  runCommand: runShellCommand,
  delay,
  sleep,
  terminateProcessTree,
}

export async function executeRetry(
  params: ExecuteRetryParams,
  dependencies: RuntimeDependencies = runtimeDependencies,
): Promise<FinalResult> {
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
      async () => runAttempt(params, attempt, dependencies),
    )

    if (finalAttempt.outcome === 'success') {
      return toFinalResult(finalAttempt)
    }

    if (attempt >= params.maxAttempts) {
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
  command: CommandExecution,
  attempt: number,
  dependencies: RuntimeDependencies,
): Promise<AttemptResult> {
  core.info(`Running command: ${command.command}`)

  let running: RunningCommand | undefined
  let timeoutCancel: (() => void) | undefined

  const onSignal = async (signal: NodeJS.Signals): Promise<void> => {
    if (running?.isRunning()) {
      core.warning(
        `Received ${signal}. Terminating active command process tree.`,
      )
      try {
        await dependencies.terminateProcessTree(
          running.pid,
          command.terminationGraceSeconds,
        )
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        core.error(
          `Failed to terminate process tree pid=${running.pid} grace=${command.terminationGraceSeconds}s signal=${signal}: ${message}`,
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

  try {
    running = dependencies.runCommand(command.command, command.shell)

    const completionPromise = running.completion.then((completion) => ({
      type: 'completion' as const,
      completion,
    }))

    let racePromise: Promise<
      | { type: 'completion'; completion: { exitCode: number | null } }
      | { type: 'timeout' }
    > = completionPromise

    if (command.timeoutSeconds !== undefined) {
      const timeout = dependencies.delay(command.timeoutSeconds * 1000)
      timeoutCancel = timeout.cancel
      const timeoutPromise = timeout.promise.then(() => ({
        type: 'timeout' as const,
      }))
      racePromise = Promise.race([completionPromise, timeoutPromise])
    }

    const result = await racePromise

    if (result.type === 'timeout') {
      core.warning(
        `Attempt ${attempt} timed out after ${command.timeoutSeconds}s.`,
      )

      try {
        await dependencies.terminateProcessTree(
          running.pid,
          command.terminationGraceSeconds,
        )
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        core.error(
          `Failed timeout termination pid=${running.pid} grace=${command.terminationGraceSeconds}s: ${message}`,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    core.error(`Attempt ${attempt} failed to execute command: ${message}`)

    return {
      attempt,
      outcome: 'error',
      exitCode: null,
    }
  } finally {
    if (timeoutCancel) {
      timeoutCancel()
    }
    process.off('SIGTERM', onSigterm)
    process.off('SIGINT', onSigint)
  }
}

function formatExitCode(exitCode: number | null): string {
  return exitCode === null ? 'none' : String(exitCode)
}

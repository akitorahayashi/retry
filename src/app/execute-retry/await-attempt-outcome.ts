import * as core from '@actions/core'
import type { RunningCommand } from '../../adapters/run-shell-command'
import type { CommandSpec } from '../../domain/command'
import type { AttemptOutcome } from '../../domain/policy'
import { formatExitCode } from './format-exit-code'

interface AwaitAttemptOutcomeDependencies {
  delay: (milliseconds: number) => {
    promise: Promise<void>
    cancel: () => void
  }
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

export type ExecutionResult =
  | { outcome: 'success'; exitCode: number; stdout: string }
  | { outcome: 'error'; exitCode: number | null; stdout: string }
  | { outcome: 'timeout'; exitCode: null; stdout: string }

type RaceOutcome =
  | { type: 'completion'; exitCode: number | null; stdout: string }
  | { type: 'timeout' }

export async function awaitAttemptOutcome(
  command: CommandSpec,
  attempt: number,
  runningCommand: RunningCommand,
  dependencies: AwaitAttemptOutcomeDependencies,
): Promise<ExecutionResult> {
  const completionPromise: Promise<RaceOutcome> =
    runningCommand.completion.then((completion) => ({
      type: 'completion',
      exitCode: completion.exitCode,
      stdout: completion.stdout,
    }))

  if (command.timeoutSeconds === undefined) {
    const completion = await completionPromise
    if (completion.type === 'timeout') {
      throw new Error('Unexpected timeout when timeout is undefined')
    }
    if (completion.exitCode === 0) {
      return {
        outcome: 'success',
        exitCode: completion.exitCode,
        stdout: completion.stdout,
      }
    }
    return {
      outcome: 'error',
      exitCode: completion.exitCode,
      stdout: completion.stdout,
    }
  }

  const timeout = dependencies.delay(command.timeoutSeconds * 1000)

  try {
    const result: RaceOutcome = await Promise.race([
      completionPromise,
      timeout.promise.then((): RaceOutcome => ({ type: 'timeout' })),
    ])

    if (result.type === 'completion') {
      if (result.exitCode === 0) {
        return {
          outcome: 'success',
          exitCode: result.exitCode,
          stdout: result.stdout,
        }
      }
      return {
        outcome: 'error',
        exitCode: result.exitCode,
        stdout: result.stdout,
      }
    }

    core.warning(
      `Attempt ${attempt} timed out after ${command.timeoutSeconds}s.`,
    )

    await dependencies.terminateProcessTree(
      runningCommand.pid,
      command.terminationGraceSeconds,
    )

    const terminationTimeout = dependencies.delay(5000)

    try {
      const finalCompletion: RaceOutcome = await Promise.race([
        runningCommand.completion.then(
          (res): RaceOutcome => ({
            type: 'completion',
            ...res,
          }),
        ),
        terminationTimeout.promise.then(
          (): RaceOutcome => ({ type: 'timeout' }),
        ),
      ])

      if (finalCompletion.type === 'timeout') {
        core.warning(
          `Process pid=${runningCommand.pid} failed to complete after termination. Returning safe outcome.`,
        )
        return {
          outcome: 'timeout',
          exitCode: null,
          stdout: '',
        }
      }

      // For timeout outcomes, the exit code from a terminated process isn't
      // representative of the command's execution, so we always use null.
      return {
        outcome: 'timeout',
        exitCode: null,
        stdout: finalCompletion.stdout,
      }
    } finally {
      terminationTimeout.cancel()
    }
  } finally {
    timeout.cancel()
  }
}

export function logAttemptCompletion(
  attempt: number,
  outcome: AttemptOutcome,
  exitCode: number | null,
): void {
  core.info(
    `Attempt ${attempt} completed with outcome=${outcome} exitCode=${formatExitCode(exitCode)}`,
  )
}

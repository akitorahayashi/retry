import * as core from '@actions/core'
import type { RunningCommand } from '../../adapters/run-shell-command'
import type { CommandSpec } from '../../domain/command'
import type { AttemptResult } from '../../domain/result'
import type { ExecuteRetryDependencies } from './execute-retry-dependencies'
import {
  awaitAttemptOutcome,
  logAttemptCompletion,
} from './await-attempt-outcome'
import { registerCommandTerminationOnSignal } from './terminate-command-on-signal'
import { sanitizeCommand } from './sanitize-command'

export { sanitizeCommand }

export async function executeAttempt(
  command: CommandSpec,
  attempt: number,
  dependencies: ExecuteRetryDependencies,
): Promise<AttemptResult> {
  core.info(`Running command: ${sanitizeCommand(command.command)}`)

  let runningCommand: RunningCommand | undefined

  const unregisterSignalHooks = registerCommandTerminationOnSignal({
    getRunningCommand: () => runningCommand,
    terminationGraceSeconds: command.terminationGraceSeconds,
    terminateProcessTree: dependencies.terminateProcessTree,
  })

  try {
    try {
      runningCommand = dependencies.runCommand(command.command, command.shell)

      const result = await awaitAttemptOutcome(
        command,
        attempt,
        runningCommand,
        dependencies,
      )

      logAttemptCompletion(attempt, result.outcome, result.exitCode)

      if (result.outcome === 'success') {
        if (result.exitCode === null) {
          throw new Error(
            'Successful attempt must include a numeric exit code.',
          )
        }

        return {
          attempt,
          outcome: 'success',
          exitCode: result.exitCode,
          stdout: result.stdout,
        }
      }

      if (result.outcome === 'timeout') {
        return {
          attempt,
          outcome: 'timeout',
          exitCode: null,
          stdout: result.stdout,
        }
      }

      return {
        attempt,
        outcome: 'error',
        exitCode: result.exitCode,
        stdout: result.stdout,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      core.error(`Attempt ${attempt} failed with error: ${errorMessage}`)

      return {
        attempt,
        outcome: 'error',
        exitCode: null,
        stdout: '',
      }
    }
  } finally {
    unregisterSignalHooks()
  }
}

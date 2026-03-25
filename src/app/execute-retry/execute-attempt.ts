import * as core from '@actions/core'
import type { RunningCommand } from '../../adapters/run-shell-command'
import type { CommandExecution } from '../../domain/command'
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
  command: CommandExecution,
  attempt: number,
  dependencies: ExecuteRetryDependencies,
): Promise<AttemptResult> {
  core.info(`Running command: ${sanitizeCommand(command.command)}`)

  let runningCommand: RunningCommand | undefined

  const cleanupSignalHandlers = registerCommandTerminationOnSignal({
    getRunningCommand: () => runningCommand,
    terminationGraceSeconds: command.terminationGraceSeconds,
    terminateProcessTree: dependencies.terminateProcessTree,
  })

  try {
    runningCommand = dependencies.runCommand(command.command, command.shell)

    const result = await awaitAttemptOutcome(
      command,
      attempt,
      runningCommand,
      dependencies,
    )

    logAttemptCompletion(attempt, result.outcome, result.exitCode)

    // result.outcome might be 'success', 'error' or 'timeout'
    // but TypeScript needs us to assert the full type since AttemptResult is a discriminated union
    if (result.outcome === 'success') {
      return {
        attempt,
        outcome: 'success',
        exitCode: result.exitCode as number,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    core.error(`Attempt ${attempt} failed to execute command: ${message}`)

    return {
      attempt,
      outcome: 'error',
      exitCode: null,
      stdout: '',
    }
  } finally {
    cleanupSignalHandlers()
  }
}

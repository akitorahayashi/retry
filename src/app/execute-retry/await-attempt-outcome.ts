import * as core from '@actions/core'
import type { RunningCommand } from '../../adapters/run-shell-command'
import type { CommandExecution } from '../../domain/command'
import type { AttemptOutcome } from '../../domain/policy'
import { formatExitCode } from './format-exit-code'

interface AwaitAttemptOutcomeDependencies {
  delay: (milliseconds: number) => {
    promise: Promise<void>
    cancel: () => void
  }
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

interface AttemptExecutionOutcome {
  outcome: AttemptOutcome
  exitCode: number | null
}

export async function awaitAttemptOutcome(
  command: CommandExecution,
  attempt: number,
  runningCommand: RunningCommand,
  dependencies: AwaitAttemptOutcomeDependencies,
): Promise<AttemptExecutionOutcome> {
  const completionPromise = runningCommand.completion.then((completion) => ({
    type: 'completion' as const,
    exitCode: completion.exitCode,
  }))

  if (command.timeoutSeconds === undefined) {
    const completion = await completionPromise
    return {
      outcome: completion.exitCode === 0 ? 'success' : 'error',
      exitCode: completion.exitCode,
    }
  }

  const timeout = dependencies.delay(command.timeoutSeconds * 1000)

  try {
    const result = await Promise.race([
      completionPromise,
      timeout.promise.then(() => ({ type: 'timeout' as const })),
    ])

    if (result.type === 'completion') {
      return {
        outcome: result.exitCode === 0 ? 'success' : 'error',
        exitCode: result.exitCode,
      }
    }

    core.warning(
      `Attempt ${attempt} timed out after ${command.timeoutSeconds}s.`,
    )

    try {
      await dependencies.terminateProcessTree(
        runningCommand.pid,
        command.terminationGraceSeconds,
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      core.error(
        `Failed timeout termination pid=${runningCommand.pid} grace=${command.terminationGraceSeconds}s: ${message}`,
      )
    }

    const completion = await runningCommand.completion

    return {
      outcome: 'timeout',
      exitCode: completion.exitCode,
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

import * as core from '@actions/core'
import type { RunningCommand } from '../../adapters/run-shell-command'

interface RegisterCommandTerminationOnSignalParams {
  getRunningCommand: () => RunningCommand | undefined
  terminationGraceSeconds: number
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

export function registerCommandTerminationOnSignal(
  params: RegisterCommandTerminationOnSignalParams,
): () => void {
  const onSignal = async (signal: NodeJS.Signals): Promise<void> => {
    const runningCommand = params.getRunningCommand()
    if (!runningCommand?.isRunning()) {
      return
    }

    core.warning(`Received ${signal}. Terminating active command process tree.`)

    try {
      await params.terminateProcessTree(
        runningCommand.pid,
        params.terminationGraceSeconds,
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      core.error(
        `Failed to terminate process tree pid=${runningCommand.pid} grace=${params.terminationGraceSeconds}s signal=${signal}: ${message}`,
      )
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

  return () => {
    process.off('SIGTERM', onSigterm)
    process.off('SIGINT', onSigint)
  }
}

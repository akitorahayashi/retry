import * as core from '@actions/core'
import { emitOutputs } from './action/emit-outputs'
import { readInputs } from './action/read-inputs'
import { executeRetry } from './app/execute-retry'

async function run(): Promise<void> {
  const request = readInputs()
  const result = await executeRetry({
    command: {
      command: request.command,
      shell: request.shell,
      timeoutSeconds: request.timeoutSeconds,
      terminationGraceSeconds: request.terminationGraceSeconds,
    },
    policy: {
      retryOn: request.retryOn,
      retryOnExitCodes: request.retryOnExitCodes,
    },
    schedule: {
      retryDelaySeconds: request.retryDelaySeconds,
      retryDelayScheduleSeconds: request.retryDelayScheduleSeconds,
    },
    maxAttempts: request.maxAttempts,
  })

  emitOutputs(result)

  if (result.outcome !== 'success' && !request.continueOnError) {
    core.setFailed(
      `Command failed after ${result.attempts} attempts. outcome=${result.outcome} exit_code=${result.exitCode ?? 'none'}`,
    )
  }
}

if (require.main === module) {
  run().catch((error: unknown) => {
    if (error instanceof Error) {
      core.setFailed(error.message)
      return
    }
    core.setFailed(String(error))
  })
}

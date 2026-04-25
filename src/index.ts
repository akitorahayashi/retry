import * as core from '@actions/core'
import { emitOutputs } from './action/emit-outputs'
import { readInputs } from './action/read-inputs'
import { executeRetry } from './app/execute-retry'

async function run(): Promise<void> {
  const requestResult = readInputs()
  if (!requestResult.ok) {
    core.setFailed(requestResult.errors.join('\n'))
    return
  }
  const request = requestResult.value

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
      `Command failed after ${result.attempt} attempts. final_outcome=${result.outcome} final_exit_code=${result.exitCode ?? 'none'}`,
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

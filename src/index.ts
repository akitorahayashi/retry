import * as core from '@actions/core'
import { emitOutputs } from './action/emit-outputs'
import { readInputs } from './action/read-inputs'
import { executeRetry } from './app/execute-retry'

async function run(): Promise<void> {
  const request = readInputs()
  const result = await executeRetry(request)

  emitOutputs(result)

  if (!result.succeeded && !request.continueOnError) {
    core.setFailed(
      `Command failed after ${result.attempts} attempts. final_outcome=${result.finalOutcome} final_exit_code=${result.finalExitCode ?? 'none'}`,
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

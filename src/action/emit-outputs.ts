import * as core from '@actions/core'

export interface RetryActionOutput {
  attempts: number
  finalExitCode: number | null
  finalOutcome: 'success' | 'error' | 'timeout'
  succeeded: boolean
}

export function emitOutputs(result: RetryActionOutput): void {
  core.setOutput('attempts', result.attempts)
  core.setOutput(
    'final_exit_code',
    result.finalExitCode === null ? '' : String(result.finalExitCode),
  )
  core.setOutput('final_outcome', result.finalOutcome)
  core.setOutput('succeeded', String(result.succeeded))
}

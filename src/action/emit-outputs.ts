import * as core from '@actions/core'
import type { FinalResult } from '../domain/result'

export function emitOutputs(result: FinalResult): void {
  core.setOutput('attempts', result.attempts)
  core.setOutput(
    'final_exit_code',
    result.finalExitCode === null ? '' : String(result.finalExitCode),
  )
  core.setOutput('final_outcome', result.finalOutcome)
  core.setOutput('succeeded', String(result.succeeded))
}

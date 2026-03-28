import * as core from '@actions/core'
import { formatExitCode } from '../app/execute-retry/format-exit-code'
import type { AttemptResult } from '../domain/result'

export function emitOutputs(result: AttemptResult): void {
  core.setOutput('attempts', result.attempt)
  core.setOutput('final_exit_code', formatExitCode(result.exitCode))
  core.setOutput('final_outcome', result.outcome)
  core.setOutput('succeeded', String(result.outcome === 'success'))
  core.setOutput('final_stdout', result.stdout)
}

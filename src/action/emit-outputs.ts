import * as core from '@actions/core'
import type { FinalResult } from '../domain/result'

export function emitOutputs(result: FinalResult): void {
  core.setOutput('attempts', result.attempts)
  core.setOutput(
    'exit_code',
    result.exitCode === null ? '' : String(result.exitCode),
  )
  core.setOutput('outcome', result.outcome)
  core.setOutput('succeeded', String(result.outcome === 'success'))
  core.setOutput('stdout', result.stdout)
}

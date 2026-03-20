import type { AttemptOutcome } from './policy'

export interface AttemptResult {
  attempt: number
  outcome: AttemptOutcome
  exitCode: number | null
}

export interface FinalResult {
  attempts: number
  finalExitCode: number | null
  finalOutcome: AttemptOutcome
  succeeded: boolean
}

export function toFinalResult(result: AttemptResult): FinalResult {
  return {
    attempts: result.attempt,
    finalExitCode: result.exitCode,
    finalOutcome: result.outcome,
    succeeded: result.outcome === 'success',
  }
}

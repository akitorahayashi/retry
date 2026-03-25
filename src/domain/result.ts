export type AttemptResult =
  | {
      attempt: number
      outcome: 'success'
      exitCode: number
      stdout: string
    }
  | {
      attempt: number
      outcome: 'error'
      exitCode: number | null
      stdout: string
    }
  | {
      attempt: number
      outcome: 'timeout'
      exitCode: null
      stdout: string
    }

export type FinalResult =
  | {
      attempts: number
      finalExitCode: number
      finalOutcome: 'success'
      succeeded: true
      finalStdout: string
    }
  | {
      attempts: number
      finalExitCode: number | null
      finalOutcome: 'error'
      succeeded: false
      finalStdout: string
    }
  | {
      attempts: number
      finalExitCode: null
      finalOutcome: 'timeout'
      succeeded: false
      finalStdout: string
    }

export function toFinalResult(result: AttemptResult): FinalResult {
  switch (result.outcome) {
    case 'success':
      return {
        attempts: result.attempt,
        finalExitCode: result.exitCode,
        finalOutcome: 'success',
        succeeded: true,
        finalStdout: result.stdout,
      }
    case 'error':
      return {
        attempts: result.attempt,
        finalExitCode: result.exitCode,
        finalOutcome: 'error',
        succeeded: false,
        finalStdout: result.stdout,
      }
    case 'timeout':
      return {
        attempts: result.attempt,
        finalExitCode: null,
        finalOutcome: 'timeout',
        succeeded: false,
        finalStdout: result.stdout,
      }
  }
}

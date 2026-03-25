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
      outcome: 'success'
      exitCode: number
      stdout: string
    }
  | {
      attempts: number
      outcome: 'error'
      exitCode: number | null
      stdout: string
    }
  | {
      attempts: number
      outcome: 'timeout'
      exitCode: null
      stdout: string
    }

export function toFinalResult(result: AttemptResult): FinalResult {
  switch (result.outcome) {
    case 'success':
      return {
        attempts: result.attempt,
        outcome: result.outcome,
        exitCode: result.exitCode,
        stdout: result.stdout,
      }
    case 'error':
      return {
        attempts: result.attempt,
        outcome: result.outcome,
        exitCode: result.exitCode,
        stdout: result.stdout,
      }
    case 'timeout':
      return {
        attempts: result.attempt,
        outcome: result.outcome,
        exitCode: result.exitCode,
        stdout: result.stdout,
      }
  }
}

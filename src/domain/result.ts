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

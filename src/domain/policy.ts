export type AttemptOutcome = 'success' | 'error' | 'timeout'
export type RetryOn = 'any' | 'error' | 'timeout'

export interface RetryPolicy {
  retryOn: RetryOn
  retryOnExitCodes?: ReadonlySet<number>
}

export function shouldRetryFailure(
  outcome: AttemptOutcome,
  exitCode: number | null,
  policy: RetryPolicy,
): boolean {
  switch (outcome) {
    case 'success':
      return false

    case 'timeout':
      if (policy.retryOn === 'error') {
        return false
      }
      return true

    case 'error':
      if (policy.retryOn === 'timeout') {
        return false
      }

      if (policy.retryOnExitCodes) {
        if (exitCode === null) {
          return false
        }
        return policy.retryOnExitCodes.has(exitCode)
      }

      return true

    default: {
      const _exhaustiveCheck: never = outcome
      throw new Error(`Unexpected outcome: ${_exhaustiveCheck}`)
    }
  }
}

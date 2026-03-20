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
  if (outcome === 'success') {
    return false
  }

  if (policy.retryOn === 'error' && outcome !== 'error') {
    return false
  }

  if (policy.retryOn === 'timeout' && outcome !== 'timeout') {
    return false
  }

  if (outcome === 'error' && policy.retryOnExitCodes) {
    if (exitCode === null) {
      return false
    }
    return policy.retryOnExitCodes.has(exitCode)
  }

  return true
}

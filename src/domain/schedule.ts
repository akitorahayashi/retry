export interface RetrySchedule {
  retryDelaySeconds: number
  retryDelayScheduleSeconds: readonly number[]
}

export function resolveAttemptDelaySeconds(
  attempt: number,
  schedule: RetrySchedule,
): number {
  const scheduleValue = schedule.retryDelayScheduleSeconds[attempt - 1]
  if (typeof scheduleValue === 'number') {
    return scheduleValue
  }
  return schedule.retryDelaySeconds
}

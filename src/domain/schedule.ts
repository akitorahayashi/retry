export interface RetrySchedule {
  retryDelaySeconds: number
  retryDelayScheduleSeconds: readonly number[]
}

export function resolveRetryDelaySeconds(
  attempt: number,
  schedule: RetrySchedule,
): number {
  const scheduleValue = schedule.retryDelayScheduleSeconds[attempt - 1]
  if (typeof scheduleValue === 'number') {
    return scheduleValue
  }
  return schedule.retryDelaySeconds
}

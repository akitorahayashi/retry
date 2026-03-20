export interface RetrySchedule {
  defaultDelaySeconds: number
  retryDelayScheduleSeconds: readonly number[]
}

export function resolveRetryDelaySeconds(
  retryIndex: number,
  schedule: RetrySchedule,
): number {
  const scheduleValue = schedule.retryDelayScheduleSeconds[retryIndex - 1]
  if (typeof scheduleValue === 'number') {
    return scheduleValue
  }
  return schedule.defaultDelaySeconds
}

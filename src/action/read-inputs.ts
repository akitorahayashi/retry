import * as core from '@actions/core'

export type RetryOn = 'any' | 'error' | 'timeout'

export interface RetryRequest {
  command: string
  maxAttempts: number
  shell: string
  timeoutSeconds?: number
  retryDelaySeconds: number
  retryDelayScheduleSeconds: number[]
  retryOn: RetryOn
  retryOnExitCodes?: ReadonlySet<number>
  continueOnError: boolean
  terminationGraceSeconds: number
}

export function readInputs(): RetryRequest {
  const command = readRequiredString('command')

  return {
    command,
    maxAttempts: readRequiredInteger('max_attempts', { minimum: 1 }),
    shell: readOptionalString('shell') ?? 'bash',
    timeoutSeconds: readOptionalInteger('timeout_seconds', { minimum: 1 }),
    retryDelaySeconds:
      readOptionalInteger('retry_delay_seconds', { minimum: 0 }) ?? 0,
    retryDelayScheduleSeconds: readIntegerList('retry_delay_schedule_seconds', {
      minimum: 0,
    }),
    retryOn: readRetryOn('retry_on'),
    retryOnExitCodes: readExitCodeSet('retry_on_exit_codes'),
    continueOnError: readBooleanFlag('continue_on_error'),
    terminationGraceSeconds:
      readOptionalInteger('termination_grace_seconds', { minimum: 1 }) ?? 5,
  }
}

function readRequiredString(name: string): string {
  const value = core.getInput(name)
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error(`Input '${name}' is required.`)
  }
  return trimmed
}

function readOptionalString(name: string): string | undefined {
  const value = core.getInput(name)
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

function readOptionalInteger(
  name: string,
  options: { minimum: number },
): number | undefined {
  const value = readOptionalString(name)
  if (!value) {
    return undefined
  }
  return parseInteger(name, value, options)
}

function readRequiredInteger(
  name: string,
  options: { minimum: number },
): number {
  const value = readRequiredString(name)
  return parseInteger(name, value, options)
}

function parseInteger(
  name: string,
  value: string,
  options: { minimum: number },
): number {
  if (!/^[-+]?\d+$/.test(value)) {
    throw new Error(`Input '${name}' must be an integer.`)
  }

  const parsed = Number.parseInt(value, 10)

  if (parsed < options.minimum) {
    throw new Error(`Input '${name}' must be >= ${options.minimum}.`)
  }

  return parsed
}

function readBooleanFlag(name: string): boolean {
  const value = readOptionalString(name)
  if (!value) {
    return false
  }

  switch (value.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    default:
      return false
  }
}

function readRetryOn(name: string): RetryOn {
  const value = readOptionalString(name)
  if (!value) {
    return 'any'
  }

  const normalized = value.toLowerCase()
  if (
    normalized === 'any' ||
    normalized === 'error' ||
    normalized === 'timeout'
  ) {
    return normalized
  }

  throw new Error("Input 'retry_on' must be one of: any, error, timeout.")
}

function readIntegerList(name: string, options: { minimum: number }): number[] {
  const value = readOptionalString(name)
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => parseInteger(name, item.trim(), options))
}

function readExitCodeSet(name: string): ReadonlySet<number> | undefined {
  const values = readIntegerList(name, { minimum: 0 })
  if (values.length === 0) {
    return undefined
  }
  return new Set(values)
}

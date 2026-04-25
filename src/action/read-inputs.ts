import * as core from '@actions/core'
import type { RetryOn } from '../domain/policy'

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

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

export function readInputs(): ParseResult<RetryRequest> {
  const errors: string[] = []

  const command = readRequiredString('command')
  if (!command.ok) errors.push(...command.errors)

  const maxAttempts = readRequiredInteger('max_attempts', { minimum: 1 })
  if (!maxAttempts.ok) errors.push(...maxAttempts.errors)

  const shell = readOptionalString('shell')

  const timeoutSeconds = readOptionalInteger('timeout_seconds', { minimum: 1 })
  if (!timeoutSeconds.ok) errors.push(...timeoutSeconds.errors)

  const retryDelaySeconds = readOptionalInteger('retry_delay_seconds', {
    minimum: 0,
  })
  if (!retryDelaySeconds.ok) errors.push(...retryDelaySeconds.errors)

  const retryDelayScheduleSeconds = readIntegerList(
    'retry_delay_schedule_seconds',
    {
      minimum: 0,
    },
  )
  if (!retryDelayScheduleSeconds.ok)
    errors.push(...retryDelayScheduleSeconds.errors)

  const retryOn = readRetryOn('retry_on')
  if (!retryOn.ok) errors.push(...retryOn.errors)

  const retryOnExitCodes = readExitCodeSet('retry_on_exit_codes')
  if (!retryOnExitCodes.ok) errors.push(...retryOnExitCodes.errors)

  const continueOnError = readBooleanFlag('continue_on_error')
  if (!continueOnError.ok) errors.push(...continueOnError.errors)

  const terminationGraceSeconds = readOptionalInteger(
    'termination_grace_seconds',
    { minimum: 1 },
  )
  if (!terminationGraceSeconds.ok)
    errors.push(...terminationGraceSeconds.errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      command: (command as { ok: true; value: string }).value,
      maxAttempts: (maxAttempts as { ok: true; value: number }).value,
      shell: shell ?? 'bash',
      timeoutSeconds: (
        timeoutSeconds as { ok: true; value: number | undefined }
      ).value,
      retryDelaySeconds:
        (retryDelaySeconds as { ok: true; value: number | undefined }).value ??
        0,
      retryDelayScheduleSeconds: (
        retryDelayScheduleSeconds as { ok: true; value: number[] }
      ).value,
      retryOn: (retryOn as { ok: true; value: RetryOn }).value,
      retryOnExitCodes: (
        retryOnExitCodes as {
          ok: true
          value: ReadonlySet<number> | undefined
        }
      ).value,
      continueOnError: (continueOnError as { ok: true; value: boolean }).value,
      terminationGraceSeconds:
        (terminationGraceSeconds as { ok: true; value: number | undefined })
          .value ?? 5,
    },
  }
}

function readRequiredString(name: string): ParseResult<string> {
  const value = core.getInput(name)
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { ok: false, errors: [`Input '${name}' is required.`] }
  }
  return { ok: true, value: trimmed }
}

function readOptionalString(name: string): string | undefined {
  const value = core.getInput(name)
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

function readOptionalInteger(
  name: string,
  options: { minimum: number },
): ParseResult<number | undefined> {
  const value = readOptionalString(name)
  if (!value) {
    return { ok: true, value: undefined }
  }
  return parseInteger(name, value, options)
}

function readRequiredInteger(
  name: string,
  options: { minimum: number },
): ParseResult<number> {
  const valueResult = readRequiredString(name)
  if (!valueResult.ok) {
    return valueResult
  }
  return parseInteger(name, valueResult.value, options)
}

function parseInteger(
  name: string,
  value: string,
  options: { minimum: number },
): ParseResult<number> {
  if (!/^[-+]?\d+$/.test(value)) {
    return { ok: false, errors: [`Input '${name}' must be an integer.`] }
  }

  const parsed = Number.parseInt(value, 10)

  if (parsed < options.minimum) {
    return {
      ok: false,
      errors: [`Input '${name}' must be >= ${options.minimum}.`],
    }
  }

  return { ok: true, value: parsed }
}

function readBooleanFlag(name: string): ParseResult<boolean> {
  const value = readOptionalString(name)
  if (!value) {
    return { ok: true, value: false }
  }

  const normalized = value.toLowerCase()

  switch (normalized) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return { ok: true, value: true }
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return { ok: true, value: false }
    default:
      return {
        ok: false,
        errors: [
          `Input '${name}' must be a boolean token: 1, 0, true, false, yes, no, on, off.`,
        ],
      }
  }
}

function readRetryOn(name: string): ParseResult<RetryOn> {
  const value = readOptionalString(name)
  if (!value) {
    return { ok: true, value: 'any' }
  }

  const normalized = value.toLowerCase()
  if (
    normalized === 'any' ||
    normalized === 'error' ||
    normalized === 'timeout'
  ) {
    return { ok: true, value: normalized as RetryOn }
  }

  return {
    ok: false,
    errors: ["Input 'retry_on' must be one of: any, error, timeout."],
  }
}

function readIntegerList(
  name: string,
  options: { minimum: number },
): ParseResult<number[]> {
  const value = readOptionalString(name)
  if (!value) {
    return { ok: true, value: [] }
  }

  const items = value.split(',').map((item) => item.trim())
  const parsedItems: number[] = []
  const errors: string[] = []

  for (const item of items) {
    const parsed = parseInteger(name, item, options)
    if (parsed.ok) {
      parsedItems.push(parsed.value)
    } else {
      errors.push(...parsed.errors)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: parsedItems }
}

function readExitCodeSet(
  name: string,
): ParseResult<ReadonlySet<number> | undefined> {
  const valuesResult = readIntegerList(name, { minimum: 0 })
  if (!valuesResult.ok) {
    return valuesResult
  }

  if (valuesResult.value.length === 0) {
    return { ok: true, value: undefined }
  }
  return { ok: true, value: new Set(valuesResult.value) }
}

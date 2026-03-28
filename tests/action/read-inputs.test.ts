import { afterEach, describe, expect, it, vi } from 'vitest'
import * as core from '@actions/core'
import { readInputs } from '../../src/action/read-inputs'

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
}))

const mockedGetInput = vi.mocked(core.getInput)

describe('readInputs', () => {
  afterEach(() => {
    mockedGetInput.mockReset()
  })

  it('reads required fields and applies defaults', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return ' npm test '
        case 'max_attempts':
          return '3'
        default:
          return ''
      }
    })

    expect(readInputs()).toEqual({
      command: 'npm test',
      maxAttempts: 3,
      shell: 'bash',
      timeoutSeconds: undefined,
      retryDelaySeconds: 0,
      retryDelayScheduleSeconds: [],
      retryOn: 'any',
      retryOnExitCodes: undefined,
      continueOnError: false,
      terminationGraceSeconds: 5,
    })
  })

  it.each([
    { field: 'shell', value: '/bin/bash', expectedProperty: 'shell', expectedValue: '/bin/bash' },
    { field: 'timeout_seconds', value: '15', expectedProperty: 'timeoutSeconds', expectedValue: 15 },
    { field: 'retry_delay_seconds', value: '3', expectedProperty: 'retryDelaySeconds', expectedValue: 3 },
    { field: 'retry_delay_schedule_seconds', value: '1,2,5', expectedProperty: 'retryDelayScheduleSeconds', expectedValue: [1, 2, 5] },
    { field: 'retry_on', value: 'error', expectedProperty: 'retryOn', expectedValue: 'error' },
    { field: 'retry_on_exit_codes', value: '1,2,9', expectedProperty: 'retryOnExitCodes', expectedValue: new Set([1, 2, 9]) },
    { field: 'continue_on_error', value: 'yes', expectedProperty: 'continueOnError', expectedValue: true },
    { field: 'termination_grace_seconds', value: '2', expectedProperty: 'terminationGraceSeconds', expectedValue: 2 },
  ])('parses optional field $field', ({ field, value, expectedProperty, expectedValue }) => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'command') return 'npm run check'
      if (name === 'max_attempts') return '5'
      if (name === field) return value
      return ''
    })

    const result = readInputs()
    expect(result[expectedProperty as keyof ReturnType<typeof readInputs>]).toEqual(expectedValue)
  })

  it('throws when required command is missing', () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'command') {
        return ' '
      }
      return '1'
    })

    expect(() => readInputs()).toThrow("Input 'command' is required.")
  })

  it('throws for invalid retry_on value', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'echo ok'
        case 'max_attempts':
          return '2'
        case 'retry_on':
          return 'sometimes'
        default:
          return ''
      }
    })

    expect(() => readInputs()).toThrow(
      "Input 'retry_on' must be one of: any, error, timeout.",
    )
  })

  it('throws when numeric value violates minimum', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'echo ok'
        case 'max_attempts':
          return '0'
        default:
          return ''
      }
    })

    expect(() => readInputs()).toThrow("Input 'max_attempts' must be >= 1.")
  })

  it.each([
    { field: 'max_attempts', value: '3.5' },
    { field: 'timeout_seconds', value: '10.2' },
    { field: 'timeout_seconds', value: 'abc' },
    { field: 'retry_delay_seconds', value: '1.5' },
  ])('throws when numeric value $field is not an integer', ({ field, value }) => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'command') return 'echo ok'
      if (name === 'max_attempts' && field !== 'max_attempts') return '3'
      if (name === field) return value
      return ''
    })

    expect(() => readInputs()).toThrow(
      `Input '${field}' must be an integer.`,
    )
  })

  it.each([
    { token: '0', expected: false },
    { token: 'false', expected: false },
    { token: 'no', expected: false },
    { token: 'off', expected: false },
    { token: '1', expected: true },
    { token: 'true', expected: true },
    { token: 'yes', expected: true },
    { token: 'on', expected: true },
    { token: 'True', expected: true },
    { token: 'YES', expected: true },
    { token: 'Off', expected: false },
  ])('normalizes boolean token "$token" to $expected', ({
    token,
    expected,
  }) => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'echo ok'
        case 'max_attempts':
          return '1'
        case 'continue_on_error':
          return token
        default:
          return ''
      }
    })

    const result = readInputs()
    expect(result.continueOnError).toBe(expected)
  })

  it('throws when continue_on_error uses invalid boolean token', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'echo ok'
        case 'max_attempts':
          return '2'
        case 'continue_on_error':
          return 'treu'
        default:
          return ''
      }
    })

    expect(() => readInputs()).toThrow(
      "Input 'continue_on_error' must be a boolean token: 1, 0, true, false, yes, no, on, off.",
    )
  })
})

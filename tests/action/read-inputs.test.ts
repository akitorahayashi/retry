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

  it('parses all optional fields', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'npm run check'
        case 'max_attempts':
          return '5'
        case 'shell':
          return '/bin/bash'
        case 'timeout_seconds':
          return '15'
        case 'retry_delay_seconds':
          return '3'
        case 'retry_delay_schedule_seconds':
          return '1,2,5'
        case 'retry_on':
          return 'error'
        case 'retry_on_exit_codes':
          return '1,2,9'
        case 'continue_on_error':
          return 'yes'
        case 'termination_grace_seconds':
          return '2'
        default:
          return ''
      }
    })

    const result = readInputs()
    expect(result.retryOnExitCodes).toEqual(new Set([1, 2, 9]))
    expect(result).toEqual({
      command: 'npm run check',
      maxAttempts: 5,
      shell: '/bin/bash',
      timeoutSeconds: 15,
      retryDelaySeconds: 3,
      retryDelayScheduleSeconds: [1, 2, 5],
      retryOn: 'error',
      retryOnExitCodes: new Set([1, 2, 9]),
      continueOnError: true,
      terminationGraceSeconds: 2,
    })
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

  it('throws when numeric value is not an integer', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'command':
          return 'echo ok'
        case 'max_attempts':
          return '3.5'
        default:
          return ''
      }
    })

    expect(() => readInputs()).toThrow("Input 'max_attempts' must be an integer.")
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
  ])('normalizes boolean token "$token" to $expected', ({ token, expected }) => {
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

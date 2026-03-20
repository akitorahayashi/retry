import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveActionRequest } from '../../src/action/request'
import * as core from '@actions/core'

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
}))

const mockedGetInput = vi.mocked(core.getInput)

describe('resolveActionRequest', () => {
  afterEach(() => {
    mockedGetInput.mockReset()
  })

  it('throws when required message is blank', () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'message') {
        return '   '
      }
      return ''
    })

    expect(() => resolveActionRequest()).toThrow("Input 'message' is required.")
  })

  it('trims required and optional fields', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'message':
          return '  hello world  '
        case 'prefix':
          return '  greet  '
        case 'suffix':
          return '  done  '
        case 'uppercase':
          return '  true '
        default:
          return ''
      }
    })

    expect(resolveActionRequest()).toEqual({
      message: 'hello world',
      prefix: 'greet',
      suffix: 'done',
      uppercase: true,
    })
  })

  it('defaults uppercase to false when omitted', () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'message') {
        return 'hello'
      }
      return ''
    })

    expect(resolveActionRequest()).toEqual({
      message: 'hello',
      prefix: undefined,
      suffix: undefined,
      uppercase: false,
    })
  })

  it('treats unsupported uppercase values as false', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'message':
          return 'hello'
        case 'uppercase':
          return 'sometimes'
        default:
          return ''
      }
    })

    expect(resolveActionRequest().uppercase).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { renderMessageTemplate } from '../../src/domain/message-template'

describe('renderMessageTemplate', () => {
  it('renders the base message when optional fields are missing', () => {
    expect(
      renderMessageTemplate({
        message: 'hello',
        prefix: undefined,
        suffix: undefined,
        uppercase: false,
      }),
    ).toBe('hello')
  })

  it('renders prefix and suffix around message', () => {
    expect(
      renderMessageTemplate({
        message: 'hello',
        prefix: 'say',
        suffix: 'now',
        uppercase: false,
      }),
    ).toBe('say hello now')
  })

  it('converts the full rendered message to uppercase when enabled', () => {
    expect(
      renderMessageTemplate({
        message: 'hello',
        prefix: 'say',
        suffix: 'now',
        uppercase: true,
      }),
    ).toBe('SAY HELLO NOW')
  })
})

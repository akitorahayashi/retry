import { describe, expect, it } from 'vitest'
import { renderMessage } from '../../src/app/render-message'

describe('renderMessage', () => {
  it('delegates request rendering to domain template logic', () => {
    expect(
      renderMessage({
        message: 'world',
        prefix: 'hello',
        suffix: 'again',
        uppercase: false,
      }),
    ).toBe('hello world again')
  })

  it('supports uppercase mode from the request', () => {
    expect(
      renderMessage({
        message: 'world',
        prefix: 'hello',
        suffix: undefined,
        uppercase: true,
      }),
    ).toBe('HELLO WORLD')
  })
})

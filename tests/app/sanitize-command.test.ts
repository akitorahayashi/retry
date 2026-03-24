import { describe, expect, it } from 'vitest'
import { sanitizeCommand } from '../../src/app/execute-retry/sanitize-command'

describe('sanitizeCommand', () => {
  it('returns "<empty>" for empty string', () => {
    expect(sanitizeCommand('')).toBe('<empty>')
  })

  it('returns "<empty>" for whitespace-only string', () => {
    expect(sanitizeCommand('   ')).toBe('<empty>')
  })

  it('returns the command name for a single command without arguments', () => {
    expect(sanitizeCommand('echo')).toBe('echo')
  })

  it('returns the command name and argument count for a command with arguments', () => {
    expect(sanitizeCommand('echo hello world')).toBe('echo [+2 args]')
  })

  it('returns the basename and argument count for a path command with arguments', () => {
    expect(sanitizeCommand('/bin/bash -c "echo hello"')).toBe(
      'bash [+3 args]',
    )
  })

  it('returns the basename and argument count for a windows path command with arguments', () => {
    expect(sanitizeCommand('C:\\Windows\\System32\\cmd.exe /c "echo hello"')).toBe(
      'cmd.exe [+3 args]',
    )
  })
})

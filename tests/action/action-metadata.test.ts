import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, beforeAll } from 'vitest'
import yaml from 'js-yaml'

interface ActionFile {
  runs: {
    using: string
    main: string
  }
  inputs: Record<string, { required?: boolean; default?: string }>
  outputs: Record<string, unknown>
}

function loadActionFile(path: string): ActionFile {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  const parsed = yaml.load(source)
  return parsed as ActionFile
}

describe('action metadata contracts', () => {
  let action: ActionFile

  beforeAll(() => {
    action = loadActionFile('action.yml')
  })

  it('configures the execution environment', () => {
    expect(action.runs.using).toBe('node24')
    expect(action.runs.main).toBe('dist/index.js')
  })

  it('defines required and optional inputs', () => {
    expect(action.inputs.command.required).toBe(true)
    expect(action.inputs.max_attempts.required).toBe(true)
    expect(action.inputs.shell.required).toBe(false)
    expect(action.inputs.shell.default).toBe('bash')
    expect(action.inputs.timeout_seconds.required).toBe(false)
    expect(action.inputs.retry_delay_seconds.required).toBe(false)
    expect(action.inputs.retry_delay_seconds.default).toBe('0')
    expect(action.inputs.retry_delay_schedule_seconds.required).toBe(false)
    expect(action.inputs.retry_on.required).toBe(false)
    expect(action.inputs.retry_on.default).toBe('any')
    expect(action.inputs.retry_on_exit_codes.required).toBe(false)
    expect(action.inputs.continue_on_error.required).toBe(false)
    expect(action.inputs.continue_on_error.default).toBe('false')
    expect(action.inputs.termination_grace_seconds.required).toBe(false)
    expect(action.inputs.termination_grace_seconds.default).toBe('5')
  })

  it('defines action outputs', () => {
    expect(Object.keys(action.outputs)).toEqual(
      expect.arrayContaining([
        'attempts',
        'exit_code',
        'outcome',
        'succeeded',
        'stdout',
      ]),
    )
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import yaml from 'js-yaml'

interface ActionFile {
  runs: {
    using: string
    main: string
  }
  inputs: Record<string, { required?: boolean }>
  outputs: Record<string, unknown>
}

function loadActionFile(path: string): ActionFile {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  const parsed = yaml.load(source)
  return parsed as ActionFile
}

describe('action metadata contracts', () => {
  it('declares node24, message input contract, and rendered output', () => {
    const action = loadActionFile('action.yml')
    expect(action.runs.using).toBe('node24')
    expect(action.runs.main).toBe('dist/index.js')
    expect(action.inputs.message.required).toBe(true)
    expect(action.inputs.prefix.required).toBe(false)
    expect(action.inputs.suffix.required).toBe(false)
    expect(action.inputs.uppercase.required).toBe(false)
    expect(Object.keys(action.outputs)).toContain('rendered-message')
  })
})

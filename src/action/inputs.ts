import * as core from '@actions/core'

export function readRequiredInput(name: string): string {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    throw new Error(`Input '${name}' is required.`)
  }
  return value.trim()
}

export function readOptionalInput(name: string): string | undefined {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}

import { readOptionalInput, readRequiredInput } from './inputs'

export interface ActionRequest {
  message: string
  prefix?: string
  suffix?: string
  uppercase: boolean
}

export function resolveActionRequest(): ActionRequest {
  return {
    message: readRequiredInput('message'),
    prefix: readOptionalInput('prefix'),
    suffix: readOptionalInput('suffix'),
    uppercase: parseBooleanFlag(readOptionalInput('uppercase')),
  }
}

function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  switch (value.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    default:
      return false
  }
}

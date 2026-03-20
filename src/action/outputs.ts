import * as core from '@actions/core'

export function emitRenderedMessageOutput(renderedMessage: string): void {
  core.setOutput('rendered-message', renderedMessage)
}

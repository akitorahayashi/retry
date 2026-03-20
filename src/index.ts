import * as core from '@actions/core'
import { emitRenderedMessageOutput } from './action/outputs'
import { resolveActionRequest } from './action/request'
import { renderMessage } from './app/render-message'

async function run(): Promise<void> {
  const request = resolveActionRequest()
  const renderedMessage = renderMessage(request)

  emitRenderedMessageOutput(renderedMessage)
  core.debug('Rendered message generated successfully.')
}

if (require.main === module) {
  run().catch((error: unknown) => {
    if (error instanceof Error) {
      core.setFailed(error.message)
      return
    }
    core.setFailed(String(error))
  })
}

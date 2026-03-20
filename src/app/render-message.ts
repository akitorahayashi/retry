import type { ActionRequest } from '../action/request'
import { renderMessageTemplate } from '../domain/message-template'

export function renderMessage(request: ActionRequest): string {
  return renderMessageTemplate(request)
}

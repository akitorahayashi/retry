import { vi } from 'vitest'
import type { ExecuteRetryRequest } from '../../src/app/execute-retry'
import type { RunningCommand } from '../../src/adapters/run-shell-command'
import type { CommandSpec } from '../../src/domain/command'

export interface ExecuteRetryRequestOverrides {
  maxAttempts?: ExecuteRetryRequest['maxAttempts']
  command?: Partial<ExecuteRetryRequest['command']>
  policy?: Partial<ExecuteRetryRequest['policy']>
  schedule?: Partial<ExecuteRetryRequest['schedule']>
}

export function createExecuteRetryRequest(
  overrides?: ExecuteRetryRequestOverrides,
): ExecuteRetryRequest {
  return {
    maxAttempts: overrides?.maxAttempts ?? 3,
    command: createCommandSpec(overrides?.command),
    policy: {
      retryOn: 'any' as const,
      retryOnExitCodes: undefined,
      ...(overrides?.policy || {}),
    },
    schedule: {
      retryDelaySeconds: 0,
      retryDelayScheduleSeconds: [],
      ...(overrides?.schedule || {}),
    },
  }
}

export function createCommandSpec(
  overrides?: Partial<CommandSpec>,
): CommandSpec {
  return {
    command: 'echo test',
    shell: 'bash',
    timeoutSeconds: undefined,
    terminationGraceSeconds: 1,
    ...(overrides || {}),
  }
}

export function createCompletedCommand(
  exitCode: number | null,
  stdout = '',
): RunningCommand {
  return {
    pid: 100,
    completion: Promise.resolve({ exitCode, stdout }),
    isRunning: () => false,
  }
}

export function createRunningCommand(
  pid = 1234,
  completionPromise?: Promise<{ exitCode: number | null; stdout: string }>,
): RunningCommand {
  return {
    pid,
    completion: completionPromise || new Promise(() => {}),
    isRunning: () => true,
  }
}

export function createNeverDelay() {
  return {
    promise: new Promise<void>(() => {}),
    cancel: vi.fn(),
  }
}

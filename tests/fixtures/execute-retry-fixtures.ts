import { vi } from 'vitest'
import type { RunningCommand } from '../../src/adapters/run-shell-command'
import type { ExecuteRetryRequest } from '../../src/app/execute-retry'
import type { CommandSpec } from '../../src/domain/command'

interface ExecuteRetryRequestOverrides {
  maxAttempts?: ExecuteRetryRequest['maxAttempts']
  command?: Partial<ExecuteRetryRequest['command']>
  policy?: Partial<ExecuteRetryRequest['policy']>
  schedule?: Partial<ExecuteRetryRequest['schedule']>
}

export function createExecuteRetryRequest(
  overrides?: ExecuteRetryRequestOverrides,
): ExecuteRetryRequest {
  const defaultCommand = {
    command: 'echo test',
    shell: 'bash',
    timeoutSeconds: undefined,
    terminationGraceSeconds: 1,
    ...(overrides?.command || {}),
  }

  const defaultPolicy = {
    retryOn: 'any' as const,
    retryOnExitCodes: undefined,
    ...(overrides?.policy || {}),
  }

  const defaultSchedule = {
    retryDelaySeconds: 0,
    retryDelayScheduleSeconds: [],
    ...(overrides?.schedule || {}),
  }

  return {
    maxAttempts: overrides?.maxAttempts ?? 3,
    command: defaultCommand,
    policy: defaultPolicy,
    schedule: defaultSchedule,
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

export function createNeverDelay() {
  return {
    promise: new Promise<void>(() => {}),
    cancel: vi.fn(),
  }
}

export function createCommandSpec(
  overrides?: Partial<CommandSpec>,
): CommandSpec {
  return {
    command: 'echo "test"',
    shell: 'bash',
    timeoutSeconds: undefined,
    terminationGraceSeconds: 5,
    ...overrides,
  }
}

export function createRunningCommand(
  completionPromise: Promise<{ exitCode: number | null; stdout: string }>,
  pid = 1234,
): RunningCommand {
  return {
    pid,
    isRunning: () => true,
    completion: completionPromise,
  }
}

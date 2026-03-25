import { delay } from '../../adapters/delay'
import {
  runShellCommand,
  type RunningCommand,
} from '../../adapters/run-shell-command'
import { terminateProcessTree } from '../../adapters/terminate-process-tree'

export interface ExecuteRetryDependencies {
  runCommand: (command: string, shell: string) => RunningCommand
  delay: (milliseconds: number) => {
    promise: Promise<void>
    cancel: () => void
  }
  terminateProcessTree: (pid: number, graceSeconds: number) => Promise<void>
}

export const executeRetryDependencies: ExecuteRetryDependencies = {
  runCommand: runShellCommand,
  delay,
  terminateProcessTree,
}

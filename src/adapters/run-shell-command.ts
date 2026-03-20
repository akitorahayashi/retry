import { spawn } from 'node:child_process'

export interface CommandCompletion {
  exitCode: number | null
}

export interface RunningCommand {
  pid: number
  completion: Promise<CommandCompletion>
  isRunning: () => boolean
}

export function runShellCommand(
  command: string,
  shell: string,
): RunningCommand {
  const child = spawn(command, {
    shell,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (typeof child.pid !== 'number') {
    throw new Error('Failed to start command process.')
  }

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(chunk)
  })

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk)
  })

  let running = true

  const completion = new Promise<CommandCompletion>((resolve, reject) => {
    child.once('error', (error) => {
      running = false
      reject(error)
    })

    child.once('close', (exitCode) => {
      running = false
      resolve({ exitCode })
    })
  })

  return {
    pid: child.pid,
    completion,
    isRunning: () => running,
  }
}

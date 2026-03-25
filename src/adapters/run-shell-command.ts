import { spawn, type SpawnOptions, type ChildProcess } from 'node:child_process'

export type SpawnFn = (command: string, options: SpawnOptions) => ChildProcess

export interface CommandCompletion {
  exitCode: number | null
  stdout: string
}

export interface RunningCommand {
  pid: number
  completion: Promise<CommandCompletion>
  isRunning: () => boolean
}

export function runShellCommand(
  command: string,
  shell: string,
  spawnFn: SpawnFn = spawn,
): RunningCommand {
  const child = spawnFn(command, {
    shell,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (typeof child.pid !== 'number') {
    throw new Error('Failed to start command process.')
  }

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString()
    try {
      process.stdout.write(chunk)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn(`[runShellCommand] Failed to write to stdout: ${msg}`)
    }
  })

  child.stderr?.on('data', (chunk) => {
    try {
      process.stderr.write(chunk)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn(`[runShellCommand] Failed to write to stderr: ${msg}`)
    }
  })

  let running = true
  let stdout = ''

  const completion = new Promise<CommandCompletion>((resolve, reject) => {
    child.once('error', (error) => {
      running = false
      reject(error)
    })

    child.once('close', (exitCode) => {
      running = false
      resolve({ exitCode, stdout })
    })
  })

  return {
    pid: child.pid,
    completion,
    isRunning: () => running,
  }
}

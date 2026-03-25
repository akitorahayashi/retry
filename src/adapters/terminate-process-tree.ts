export async function terminateProcessTree(
  pid: number,
  graceSeconds: number,
): Promise<void> {
  sendSignal(pid, 'SIGTERM')

  await wait(graceSeconds * 1000)

  if (isAlive(pid)) {
    sendSignal(pid, 'SIGKILL')
  }
}

function sendSignal(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
    return
  } catch (error) {
    // Fallback to direct pid signaling when process groups are not available.
    if (matchesCode(error, 'ESRCH')) {
      // Expected when process group doesn't exist
    } else {
      console.warn(
        `[sendSignal] Process group signal failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  try {
    process.kill(pid, signal)
  } catch (error) {
    if (matchesCode(error, 'ESRCH')) {
      // The process is already gone
      return
    }
    throw error
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (matchesCode(error, 'ESRCH')) {
      return false
    }
    if (matchesCode(error, 'EPERM')) {
      return true
    }
    throw error
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function matchesCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    (('code' in error && error.code === code) || error.message.startsWith(code))
  )
}

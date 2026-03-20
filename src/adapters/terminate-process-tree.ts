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
  } catch {
    // Fallback to direct pid signaling when process groups are not available.
  }

  try {
    process.kill(pid, signal)
  } catch {
    // The process may already be gone.
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

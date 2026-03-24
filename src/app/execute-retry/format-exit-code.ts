export function formatExitCode(exitCode: number | null): string {
  return exitCode === null ? 'none' : String(exitCode)
}

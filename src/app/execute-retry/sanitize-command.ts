export function sanitizeCommand(command: string): string {
  const parts = command.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) {
    return '<empty>'
  }

  const executablePath = parts[0]
  const basename = executablePath.split(/[/\\]/).pop() ?? executablePath
  const argsCount = parts.length - 1

  if (argsCount === 0) {
    return basename
  }

  return `${basename} [+${argsCount} args]`
}

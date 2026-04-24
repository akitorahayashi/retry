import { vi } from 'vitest'

export function createProcessSpies() {
  let resolveExit!: (code: number) => void
  const exitDone = new Promise<number>((resolve) => {
    resolveExit = resolve
  })

  return {
    once: vi.spyOn(process, 'once').mockReturnThis(),
    off: vi.spyOn(process, 'off').mockReturnThis(),
    exit: vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: number | string | null) => {
        resolveExit(Number(code))
        return undefined as never
      }),
    exitDone,
  }
}

export function findSignalHandler(
  calls: ReadonlyArray<ReadonlyArray<unknown>>,
  signal: 'SIGTERM' | 'SIGINT',
): (() => void) | undefined {
  return calls.find((call) => call[0] === signal)?.[1] as
    | (() => void)
    | undefined
}

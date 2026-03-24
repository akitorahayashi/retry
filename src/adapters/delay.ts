export function delay(milliseconds: number): {
  promise: Promise<void>
  cancel: () => void
} {
  let timeoutId: NodeJS.Timeout

  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve()
    }, milliseconds)
  })

  return { promise, cancel: () => clearTimeout(timeoutId) }
}

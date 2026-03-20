export function delay(milliseconds: number): {
  promise: Promise<void>
  cancel: () => void
} {
  let timeoutId: NodeJS.Timeout
  let cancelFunc: () => void = () => {}

  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve()
    }, milliseconds)

    cancelFunc = () => {
      clearTimeout(timeoutId)
    }
  })

  return { promise, cancel: cancelFunc }
}

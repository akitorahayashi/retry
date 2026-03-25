export interface CommandSpec {
  command: string
  shell: string
  timeoutSeconds?: number
  terminationGraceSeconds: number
}

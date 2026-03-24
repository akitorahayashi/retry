export interface CommandExecution {
  command: string
  shell: string
  timeoutSeconds?: number
  terminationGraceSeconds: number
}

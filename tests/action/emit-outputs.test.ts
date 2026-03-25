import * as core from '@actions/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { emitOutputs } from '../../src/action/emit-outputs'

describe('emitOutputs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits final stdout alongside final outcome outputs', () => {
    const setOutput = vi.spyOn(core, 'setOutput').mockImplementation(() => {})

    emitOutputs({
      attempts: 2,
      exitCode: 0,
      outcome: 'success',
      stdout: '{"ok":true}',
    })

    expect(setOutput).toHaveBeenCalledWith('attempts', 2)
    expect(setOutput).toHaveBeenCalledWith('exit_code', '0')
    expect(setOutput).toHaveBeenCalledWith('outcome', 'success')
    expect(setOutput).toHaveBeenCalledWith('succeeded', 'true')
    expect(setOutput).toHaveBeenCalledWith('stdout', '{"ok":true}')
  })
})

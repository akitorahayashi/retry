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
      attempt: 2,
      exitCode: 0,
      outcome: 'success',
      stdout: '{"ok":true}',
    })

    expect(setOutput).toHaveBeenCalledWith('attempts', 2)
    expect(setOutput).toHaveBeenCalledWith('final_exit_code', '0')
    expect(setOutput).toHaveBeenCalledWith('final_outcome', 'success')
    expect(setOutput).toHaveBeenCalledWith('succeeded', 'true')
    expect(setOutput).toHaveBeenCalledWith('final_stdout', '{"ok":true}')
  })

  it('emits "none" for final_exit_code when exitCode is null', () => {
    const setOutput = vi.spyOn(core, 'setOutput').mockImplementation(() => {})

    emitOutputs({
      attempt: 1,
      exitCode: null,
      outcome: 'timeout',
      stdout: '',
    })

    expect(setOutput).toHaveBeenCalledWith('attempts', 1)
    expect(setOutput).toHaveBeenCalledWith('final_exit_code', 'none')
    expect(setOutput).toHaveBeenCalledWith('final_outcome', 'timeout')
    expect(setOutput).toHaveBeenCalledWith('succeeded', 'false')
    expect(setOutput).toHaveBeenCalledWith('final_stdout', '')
  })
})

---
label: "refacts"
created_at: "2024-03-27"
author_role: "qa"
confidence: "high"
---

## Problem

Some tests cover multiple concerns, making them harder to diagnose when they fail. They assert multiple independent behaviors in a single `it` block.

## Goal

Split multi-concern tests into smaller, more focused tests that each verify a single externally visible behavior.

## Context

A test like `it('interrupts running command and terminates process tree on $signal', async ({signal, pid}) => {...})` in `execute-retry.test.ts` asserts not only that the command was interrupted, but also that the `terminateProcessTree` was called, that signal handlers were cleaned up correctly, and that the appropriate result is returned. If one of these assertions fails, it might mask failures in the others, making root-cause analysis slower.

## Evidence

- path: "tests/app/execute-retry.test.ts"
  loc: "107-164"
  note: "The `interrupts running command and terminates process tree on $signal` test case asserts that `terminateProcessTree` is called, that signal handlers are removed (`processOffSpy.toHaveBeenCalledWith`), and the overall result `resultPromise` behaves correctly. These could be split."
- path: "tests/action/read-inputs.test.ts"
  loc: "44-80"
  note: "Test `parses all optional fields` asserts multiple different optional fields at once. While seemingly harmless, if one parsing logic breaks, the test fails, and one has to read the stack trace to see which property assertion failed. Testing parsing per property group would be clearer."
- path: "tests/action/read-inputs.test.ts"
  loc: "123-176"
  note: "Test `throws when numeric value is not an integer` tests three separate input properties (`max_attempts`, `timeout_seconds`, `retry_delay_seconds`) sequentially within the same `it` block. A failure in the first assertion prevents the subsequent assertions from executing, hiding potential multiple regressions."

## Change Scope

- `tests/app/execute-retry.test.ts`
- `tests/action/read-inputs.test.ts`

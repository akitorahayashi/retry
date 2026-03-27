---
label: "tests"
---

## Goal

Split multi-concern tests into smaller, more focused tests that each verify a single externally visible behavior to improve diagnostics when they fail.

## Current State

Tests currently assert multiple independent behaviors in single test cases, masking failures.
- `tests/app/execute-retry.test.ts`: The test `interrupts running command and terminates process tree on $signal` asserts that `terminateProcessTree` is called, that signal handlers are removed, and that the result behaves correctly all within the same `it` block.
- `tests/action/read-inputs.test.ts`: The test `parses all optional fields` asserts multiple different optional fields at once. The test `throws when numeric value is not an integer` tests three separate input properties sequentially within the same `it` block.

## Plan

1. Split `interrupts running command and terminates process tree on $signal` in `tests/app/execute-retry.test.ts` into individual tests:
   - Extract common setup using a helper function or `beforeEach`.
   - Test 1: Assert that `terminateProcessTree` is called with the correct arguments when receiving `$signal`.
   - Test 2: Assert that signal handlers are correctly removed after the process is interrupted by `$signal`.
2. Split `parses all optional fields` in `tests/action/read-inputs.test.ts`:
   - Replace the single test with an `it.each` block that validates parsing for each optional field individually (e.g., `shell`, `timeout_seconds`, `retry_delay_seconds`, `retry_delay_schedule_seconds`, `retry_on`, `retry_on_exit_codes`, `continue_on_error`, `termination_grace_seconds`).
3. Refactor `throws when numeric value is not an integer` in `tests/action/read-inputs.test.ts`:
   - Replace the sequential assertions with an `it.each` block to independently test the failure conditions for `max_attempts`, `timeout_seconds`, and `retry_delay_seconds`.

## Acceptance Criteria

- All assertions testing multiple independent logical outcomes are split into individual test definitions (`it(...)` or `it.each(...)`).
- Each test block strictly adheres to validating one specific system state or output.
- Test context is reused appropriately to avoid excessive duplication.
- Existing behaviors are preserved.

## Risks

- Over-segmentation of tests might increase boilerplate and setup cost. Using `it.each` mitigates this by allowing multiple independent inputs to share test logic without cascading failures.
- State leakage across tests could occur if setup data is incorrectly abstracted to shared contexts. Ensuring clean mocks and resets mitigates this risk.

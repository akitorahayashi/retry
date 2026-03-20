---
label: "tests"
---

## Goal

Improve test determinism by eliminating arbitrary timeouts, and add test coverage to verify `terminateProcessTree` properly handles graceful fallback and `SIGKILL` escalations.

## Current State

Tests for `terminateProcessTree` currently suffer from flakiness and incomplete coverage due to a reliance on timing-based assertions and the absence of tests for edge cases:
- `tests/adapters/terminate-process-tree.test.ts`: Uses arbitrary `setTimeout` delays and manual interval polling (`waitUntilStopped`) to detect process termination, leading to flakiness. The file only tests the happy path, completely missing coverage for the fallback to direct pid signaling, and the escalation to `SIGKILL`.
- `src/adapters/terminate-process-tree.ts`: Relies on `setTimeout` for the grace period. While functional, it complicates deterministic testing without proper timer mocking. The graceful fallback and `SIGKILL` escalation logic remain uncovered.

## Plan

### Replace Polling with Event Listeners
Remove `waitUntilStopped` and manual `isAlive` polling. Instead, attach event listeners for the `close` or `exit` events on the spawned child process to deterministically verify process termination.

### Implement Timer Mocking
Utilize `vitest` fake timers to precisely control the `wait` function inside `terminateProcessTree`, allowing the grace period to elapse synchronously during testing without actual delays.

### Add Coverage for SIGKILL Escalation
Create a test case (using a fixture script) where a process intentionally ignores `SIGTERM`. Assert that `SIGKILL` is sent when the grace period expires.

### Add Coverage for Fallback Logic
Create a test case to simulate an environment where process groups aren't available to ensure the fallback `process.kill(pid, signal)` executes successfully.

## Acceptance Criteria

- `tests/adapters/terminate-process-tree.test.ts` does not use `waitUntilStopped` based on manual `setTimeout` intervals.
- The `terminateProcessTree` function has 100% path coverage for the `SIGKILL` escalation block.
- Flaky failures related to timing are resolved without disabling or skipping test cases.

## Risks

### Timer Interactions
Mocking timers might inadvertently affect other asynchronous operations or library internals if not correctly restored after each test.

### Dangling Processes
Forcing a process to ignore `SIGTERM` might result in zombie or leaked processes if the `SIGKILL` escalation fails to trigger or is improperly configured in tests.
---
label: "tests"
implementation_ready: false
---

## Goal

Ensure tests are deterministic, isolated from arbitrary execution time or real process scheduling, and clearly separated into arrange, act, and assert phases to provide granular failure diagnostics without tangled mock logic.

## Problem

Some tests (`terminate-process-tree.test.ts`) rely on arbitrary numeric timeouts and real child processes spawned with `setInterval`/`sleep` commands, making them non-deterministic and prone to flakes under load. Other tests (`execute-retry.test.ts`, `await-attempt-outcome.test.ts`, `terminate-command-on-signal.test.ts`) use massive setup mock functions, mock I/O boundaries at an unhelpful abstraction level, or tightly couple asynchronous execution to Node event loop internals (`process.nextTick`). This coupling creates brittle tests, makes failures hard to diagnose because massive mocks blur boundaries, and introduces race conditions.

## Evidence

- source_event: "test_determinism_and_flakes_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "16-36"
  note: "Uses real bash script spawning with an arbitrary time period of 0.05 seconds to simulate an infinite process and check termination."

- source_event: "test_determinism_and_flakes_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "50-76"
  note: "Tests `SIGKILL` escalation by checking if `isAlive` correctly tracks process state across `sleep` statements in `ignore-term-then-exit.sh`, heavily relying on execution speed and real sleep intervals."

- source_event: "test_failure_diagnosability_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "55-104"
  note: "Tests `executeRetry` by simulating timeouts through multiple mocking layers including `resolveCompletion` callbacks. The arrange phase is tangled."

- source_event: "test_failure_diagnosability_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "106-166"
  note: "Checks signal interruption by tracking `processOnceSpy`, triggering it manually, and flushing tasks via `vi.waitFor`, mingling async engine mechanics with pure policy logic."

- source_event: "test_structure_app_logic_vs_io_qa.md"
  path: "tests/app/await-attempt-outcome.test.ts"
  loc: "128-150"
  note: "Tightly couples tests to the exact number of delay calls and their timing order, returning `new Promise(() => {})` to simulate a timeout not firing, making the test hard to read and sensitive to refactors."

- source_event: "test_structure_app_logic_vs_io_qa.md"
  path: "tests/app/terminate-command-on-signal.test.ts"
  loc: "59-106"
  note: "Uses `await new Promise(process.nextTick)` repeatedly to flush microtask queue because it depends on real JS event loop scheduling rather than a deterministic clock or fully synchronous pure domain boundary."

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`
- `tests/app/execute-retry.test.ts`
- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/terminate-command-on-signal.test.ts`

## Constraints

- Pure domain logic is tested without I/O.
- I/O integration tests have explicit timing and lifecycle boundaries without flakes or brittle process mocks.
- Tests assert externally observable behavior at the owning boundary.
- Tests must separate arrange, act, and assert phases cleanly.

## Acceptance Criteria

- `terminate-process-tree.test.ts` uses deterministic IPC, mocked out streams, or deterministic test clocks instead of real sleep-based arbitrary timeouts.
- `execute-retry.test.ts` is refactored to use concise structures, breaking down massive setup mocks to provide a clear boundary.
- Tests in `await-attempt-outcome.test.ts` and `terminate-command-on-signal.test.ts` decouple from JS event loop timing and internal implementation details (e.g., removing reliance on repeated `process.nextTick`).

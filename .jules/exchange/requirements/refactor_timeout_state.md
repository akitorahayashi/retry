---
label: "refacts"
implementation_ready: false
---

## Goal

Model the timeout as a distinct resolution path (e.g., using `Promise.race`) so the state machine explicitly represents "completed" or "timed out", and decouple time from the `executeRetry` orchestrator so it can be deterministically tested.

## Problem

Timeout state inside `runAttempt` is modeled with a mutable boolean flag (`timedOut`) evaluated after the completion promise resolves, instead of racing promises. In addition, the timeout feature in `executeRetry` uses a hardcoded `setTimeout` instead of abstracting time logic, preventing deterministic unit testing of timeouts.

## Evidence

- source_event: "primitive_timeout_state_typescripter.md"
  path: "src/app/execute-retry.ts"
  loc: "line 107"
  note: "Mutable `timedOut` boolean flag initialized."
- source_event: "primitive_timeout_state_typescripter.md"
  path: "src/app/execute-retry.ts"
  loc: "line 148"
  note: "Timeout handler mutates the boolean flag asynchronously."
- source_event: "primitive_timeout_state_typescripter.md"
  path: "src/app/execute-retry.ts"
  loc: "line 170-174"
  note: "Outcome resolution implicitly couples the mutated boolean with the process exit code using a nested ternary."
- source_event: "hardcoded_timer_prevents_timeout_testing_qa.md"
  path: "src/app/execute-retry.ts"
  loc: "line 124"
  note: "Direct usage of `setTimeout` for the timeout timer prevents controlling time in tests."
- source_event: "hardcoded_timer_prevents_timeout_testing_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "entire file"
  note: "No tests validate the timeout behavior or signal handling."

## Change Scope

- `src/app/execute-retry.ts`
- `tests/app/execute-retry.test.ts`

## Constraints

- Mutable `timedOut` flags must be replaced with `Promise.race` (or equivalent structural concurrency primitives) between process completion and a timeout rejection/resolution.
- `setTimeout` in the domain logic must be replaced with an abstracted `delay` or timer function injected from dependencies.

## Acceptance Criteria

- `runAttempt` no longer maintains a mutable `timedOut` boolean variable.
- Outbound timeout resolution is guaranteed using `Promise.race` logic.
- Timeouts use the injected time abstractions, not `setTimeout`.
- Unit tests reliably confirm timeout terminations and correct `AttemptOutcome` without adding arbitrary real-time delays.

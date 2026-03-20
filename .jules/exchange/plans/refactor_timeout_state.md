---
label: "refacts"
---

## Goal

Model the timeout as a distinct resolution path using `Promise.race` to explicitly represent the state machine as "completed" or "timed out". Decouple time dependencies in the `executeRetry` orchestrator by replacing `setTimeout` with injected timer functions, enabling deterministic testing.

## Current State

The current implementation uses a mutable boolean flag evaluated after process completion and relies on hardcoded time primitives:

- `src/app/execute-retry.ts`: The `runAttempt` function models timeout state using a mutable boolean flag (`timedOut`) evaluated after the completion promise resolves. The function sets a timeout timer using a direct call to `setTimeout`, preventing deterministic control of time during testing. Additionally, the process termination sequence overlaps state modification without strict guarantees from structural primitives like `Promise.race`.
- `tests/app/execute-retry.test.ts`: Test coverage is incomplete. The lack of time abstraction means timeouts and related termination signals are not reliably tested without incurring arbitrary real-time delays.

## Plan

1. Modify the `RuntimeDependencies` interface in `src/app/execute-retry.ts` to include an injected timeout utility (e.g., returning a promise that rejects or resolves after a delay) instead of relying on `setTimeout`. A clear choice would be abstracting a `delay` function. Note that a delay/sleep function already exists and can be reused or wrapped.
2. Refactor `runAttempt` in `src/app/execute-retry.ts` to remove the mutable `timedOut` boolean. Create a timer promise based on the new injected dependency and use `Promise.race` between the command completion promise and the timeout timer promise.
3. Update `executeRetry` and the default `runtimeDependencies` object to supply the new timeout function or reuse the existing `sleep` function appropriately to construct the race condition.
4. Update `tests/app/execute-retry.test.ts` to mock the new injected time dependency, allowing tests to instantly trigger timeout conditions without real-world delays.
5. Add comprehensive unit tests in `tests/app/execute-retry.test.ts` to verify the new `Promise.race` timeout resolution. Ensure that the attempt correctly records the `timeout` outcome, and that the underlying process tree is terminated when a timeout occurs.

## Acceptance Criteria

- `runAttempt` determines timeouts using `Promise.race` between process completion and a timeout delay, rather than inspecting a mutable boolean flag.
- The `timedOut` mutable variable is removed.
- Timeout behavior relies on an injected dependency rather than the global `setTimeout`, enabling full unit test control.
- Unit tests reliably and instantly verify timeout paths, including proper `AttemptOutcome` resolution and process termination handling, without introducing arbitrary real-time delays.

## Risks

- The command completion promise could swallow errors if the `Promise.race` implementation isn't structured carefully.
- The termination of the process tree must still occur robustly when the timeout promise wins the race. Improper state handling during the race resolution could leak child processes if the timeout rejects but termination fails.

---
label: "tests"
---

## Goal

Ensure tests are deterministic, isolated from arbitrary execution time or real process scheduling, and clearly separated into arrange, act, and assert phases to provide granular failure diagnostics without tangled mock logic.

## Current State

Tests currently couple heavily with arbitrary Node/OS timing, real asynchronous process mechanics, or huge mock orchestrations, verifying internal mechanisms instead of externally observable behaviors at the owning boundary.

- `tests/adapters/terminate-process-tree.test.ts` (Integration Level): Spawns real bash scripts that use arbitrary sleep periods (e.g. `0.05` seconds). This couples test validation to actual system execution speed, making verification non-deterministic and tests prone to flaking under load.
- `tests/app/execute-retry.test.ts` (Integration Level): Deeply nested mock configurations simulate outcomes by exposing promise resolution functions to the global scope and manually managing `vi.waitFor` logic to trigger process events. This mixes policy evaluation logic with engine timing manipulation, obscuring the verification boundary.
- `tests/app/await-attempt-outcome.test.ts` (Unit Level): Tests track sequential mock invocations returning unresolved promises (`new Promise(() => {})`) to test timeout precedence, tightly coupling to the sequence of internal calls rather than verifying timeout resolution behavior.
- `tests/app/terminate-command-on-signal.test.ts` (Unit Level): Repeatedly flushes the Node event loop using `await new Promise(process.nextTick)` to enforce a synchronous execution sequence across mocked handlers, embedding assumptions about JavaScript engine task scheduling into pure behavior testing.
- `docs/usage.md` and `docs/architecture/boundary.md`: Existing development documentation lacks guidance on deterministic boundary testing, process mocking boundaries, and rules for avoiding internal timing dependencies in test suites.

## Plan

1. Decouple `terminate-process-tree` (I/O Boundary) from execution speed:
   - Establish determinism by replacing `0.05` second arbitrary waits with reliable IPC event signals, stdout parsing, or a deterministic fake clock to verify termination state without race conditions.
2. Refactor `execute-retry` (Application Policy Boundary) to verify observable application states:
   - Introduce focused test fixtures that decouple pure policy outcomes (retry counts, exit status) from the mechanics of event loop orchestration. Avoid `vi.waitFor` for simple state mutations.
3. Update `await-attempt-outcome` (App Component Boundary) to verify timeline bounds cleanly:
   - Replace unresolved promise stubs with bounded fake timers (`vi.useFakeTimers`) or discrete, resolvable delays that correctly emulate test timing rules independently of the exact order of internal calls.
4. Refactor `terminate-command-on-signal` (App Component Boundary) for deterministic signaling:
   - Remove reliance on `process.nextTick` to unblock task queues. Verify the result of termination handlers explicitly through domain object state or resolved promise chaining.
5. Update `docs/architecture/boundary.md` to establish testing practices:
   - Document the rules for testing pure components versus I/O.
   - Mandate deterministic scheduling mechanisms (fake timers, explicit promise resolution) over arbitrary `sleep`, `setTimeout`, and `process.nextTick` within the test guidelines.

## Acceptance Criteria

- All referenced test files execute synchronously and deterministically without arbitrary process delays or reliance on execution speed (`GRACE_PERIOD_SECONDS`).
- Arrange, act, and assert phases are clearly separated, completely isolating pure logic assertions from mock setup details.
- Event loop internals (`process.nextTick`) and unresolving promises are removed from the test execution path.
- Documentation dictates clear instructions for ensuring test determinism when establishing component boundaries.

## Risks

- Rewriting tests to use fake clocks or decoupled events could mask real-world race conditions if the boundary abstractions deviate from standard runtime behavior. To mitigate, maintain integration-level boundary tests with external system proxies rather than wholly faked execution environments.

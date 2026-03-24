---
label: "refacts"
---

## Goal

Define explicit sum types for Promise race outcomes and establish a consistent failure contract by escalating process and execution errors rather than coercing them to generic retry outcomes.

## Current State

- `src/app/execute-retry/await-attempt-outcome.ts`: The promise race uses unvalidated, inline type assertions to distinguish between completions and timeouts, obscuring the boundary's return types. Additionally, errors encountered when terminating a process tree are caught and suppressed, preventing proper escalation of system-level failures.
- `src/app/execute-retry/execute-attempt.ts`: The process execution boundary intercepts unknown exceptions and silently converts them into generic `error` outcomes (`AttemptResult` with `exitCode: null`), conflating command errors with infrastructure failures.
- `tests/app/execute-retry.test.ts`: Integration tests currently assert that internal exceptions and promise rejections from process spawning are successfully caught and retried, reinforcing incorrect failure semantics.

## Plan

1. Refactor Attempt Outcomes and State Representation
   - Extract the inline type assertions in `await-attempt-outcome.ts` into an explicit `RaceOutcome` discriminated union.
   - Replace the untyped `Promise.race` resolutions with the typed union for predictable branch evaluation.
2. Enforce Strict Exception Escalation
   - Remove the catch blocks within `execute-attempt.ts` that intercept runtime and promise rejection errors, ensuring execution failures propagate as unhandled exceptions rather than generic `error` outcomes.
   - Remove the `try-catch` wrapper around `dependencies.terminateProcessTree` in `await-attempt-outcome.ts` to surface termination failures.
3. Align Boundary Tests
   - Update `tests/app/execute-retry.test.ts` to assert that synchronous throws and promise rejections during command execution result in escalated failures rather than successful retry loops.

## Acceptance Criteria

- The `RaceOutcome` union explicitly types internal execution outcomes.
- Infrastructure and system errors during execution or termination are propagated and are no longer caught and retried.
- Tests accurately reflect that systemic errors break the retry loop and surface to the caller.

## Risks

- Callers that previously expected temporary spawn failures or invalid command syntaxes to be retried might now fail immediately.
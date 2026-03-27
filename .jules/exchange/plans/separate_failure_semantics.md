---
label: "refacts"
---

## Goal

Consistently separate operational/infrastructure errors from domain errors. Operational errors must throw and fail fast, while domain errors (like command execution returning a non-zero exit code or timing out) must be modeled as Result unions and appropriately retried based on policy.

## Current State

The codebase currently mixes infrastructure error handling with domain result handling, masking operational bugs and incorrectly retrying unrecoverable failures.
- `src/app/execute-retry/execute-attempt.ts`: Contains a blanket `catch (error)` that captures all runtime exceptions (e.g., `TypeError`, spawn failures) and coerces them into `{ outcome: 'error', exitCode: null }`, causing unrecoverable errors to be incorrectly retried.
- `src/app/execute-retry/await-attempt-outcome.ts`: Throws a raw `Error('Unexpected timeout when timeout is undefined')` instead of returning a domain failure result, mixing throw-based and return-based handling for a domain scenario.
- `tests/app/execute-retry.test.ts`: Asserts that synchronous errors and promise rejections from `runCommand` are caught and treated as attempt errors (domain outcomes).
- `tests/app/await-attempt-outcome.test.ts`: Asserts that an unexpected timeout throws an error rather than returning a domain failure outcome.

## Plan

1. Modify `src/app/execute-retry/execute-attempt.ts` to remove the broad `catch (error)` wrapper that coerces generic exceptions into attempt results. Allow operational and JS-level exceptions to propagate so they fail the action immediately with accurate stack traces.
2. Modify `src/app/execute-retry/await-attempt-outcome.ts` to return a domain failure result (`{ outcome: 'error', exitCode: null, stdout: completion.stdout }`) instead of throwing an `Error` for the unexpected timeout scenario when `timeoutSeconds` is undefined.
3. Update `tests/app/await-attempt-outcome.test.ts` to assert that the unexpected timeout scenario returns an error outcome instead of throwing.
4. Update `tests/app/execute-retry.test.ts` to remove expectations that `runCommand` exceptions are caught as attempt errors. Tests should assert that these operational exceptions propagate and cause the retry loop to fail fast.
5. Review the execution and retry boundary documentation, if any, to reflect the updated failure semantics (operational exceptions throw; domain failures return result objects).

## Acceptance Criteria

- The blanket `catch (error)` in `executeAttempt` is removed.
- Operational exceptions cause the process to fail fast with visible stack traces rather than being swallowed and retried.
- Unexpected timeouts in `await-attempt-outcome` return a failure result instead of throwing.
- Domain outcomes (e.g. valid non-zero exit codes) must not crash the GitHub Action.

## Risks

- Unhandled promise rejections or flaky operational issues that were previously hidden and retried as domain errors will now surface and immediately crash the execution.
- If dependencies (like `runCommand`) throw domain-level issues as errors rather than returning them, they will now break the run instead of being gracefully retried.

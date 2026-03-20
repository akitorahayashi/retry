---
label: "bugs"
---

## Goal

Ensure all command execution failures map into a valid `AttemptResult` domain object rather than crashing the loop so the retry logic can successfully handle them. Also model state handling over `AttemptOutcome` using an exhaustive `switch` block in policy handling.

## Current State

- `src/adapters/run-shell-command.ts`: `runShellCommand` throws a synchronous exception if process start fails, and rejects the completion promise on child process error. This causes system-level errors to bypass the retry loop and crash the action.
- `src/app/execute-retry.ts`: `runAttempt` awaits the completion promise without a try/catch, causing rejections to bubble out of `runAttempt`.
- `src/domain/policy.ts`: `shouldRetryFailure` uses sequential `if` statements over the `AttemptOutcome` union relying on a default fallback return, leaving new outcome variants silently unhandled.
- `tests/app/execute-retry.test.ts`: Missing coverage for synchronous exceptions and asynchronous rejections from command execution bubbling up.
- `tests/domain/policy.test.ts`: Requires test updates to cover exhaustive switch logic over `AttemptOutcome`.

## Plan

1. Update `src/app/execute-retry.ts`:
   - Wrap `dependencies.runCommand(...)` and `await running.completion` inside a `try/catch` block within `runAttempt`.
   - On catch, log the error and return an `AttemptResult` with `outcome: 'error'` and `exitCode: null`.
2. Update `src/domain/policy.ts`:
   - Rewrite `shouldRetryFailure` to use an exhaustive `switch` on `outcome`.
   - The cases will be `'success'`, `'timeout'`, and `'error'`.
   - Use standard TypeScript exhaustiveness checks (e.g., `const _exhaustiveCheck: never = outcome; return _exhaustiveCheck;`) to ensure compile-time exhaustiveness.
3. Update Tests:
   - Add tests in `tests/app/execute-retry.test.ts` for synchronously thrown errors and promise rejections from `runCommand`, asserting they result in a retryable `'error'` outcome.
   - Add test coverage in `tests/domain/policy.test.ts` for the switch logic.

## Acceptance Criteria

- When `runShellCommand` fails (either synchronously or via rejection), `runAttempt` returns an `AttemptResult` with `outcome: 'error'`.
- `executeRetry` does not crash when encountering process start failures; it retries according to policy.
- `shouldRetryFailure` in `src/domain/policy.ts` uses an exhaustive `switch` that causes compiler errors if new `AttemptOutcome` variants are added without policy definitions.

## Risks

- Swallowing critical system errors as `AttemptResult` 'error' might hide underlying configuration problems (e.g., missing shell). It's important to log the caught error.
- Exhaustiveness check in `shouldRetryFailure` might break if any types are incorrectly configured or new types are added but not handled.

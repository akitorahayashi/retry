---
label: "bugs"
implementation_ready: false
---

## Goal

Ensure all command execution failures map into a valid `AttemptResult` domain object rather than crashing the loop so the retry logic can successfully handle them. Also model state handling over `AttemptOutcome` using an exhaustive `switch` block in policy handling.

## Problem

`runShellCommand` and `runAttempt` mix exceptions (thrown synchronously or rejected asynchronously) with domain object returns (`AttemptResult`), causing system-level errors to bypass the retry loop and crash the action. In addition, `shouldRetryFailure` uses sequential `if` statements over the `AttemptOutcome` union relying on a default fallback return, leaving new outcome variants silently unhandled.

## Evidence

- source_event: "mixed_failure_semantics_typescripter.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "21-23"
  note: "Throws a synchronous exception if process start fails."
- source_event: "mixed_failure_semantics_typescripter.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "46-54"
  note: "Rejects the completion promise on child process error."
- source_event: "mixed_failure_semantics_typescripter.md"
  path: "src/app/execute-retry.ts"
  loc: "155"
  note: "Awaits the completion promise without a try/catch, causing rejections to bubble out of `runAttempt`."
- source_event: "non_exhaustive_policy_handling_typescripter.md"
  path: "src/domain/policy.ts"
  loc: "10-29"
  note: "Sequential if-statements evaluate policy logic without static exhaustiveness checking."

## Change Scope

- `src/adapters/run-shell-command.ts`
- `src/app/execute-retry.ts`
- `src/domain/policy.ts`

## Constraints

- Domain outcomes for system failure (e.g., cannot spawn child) should map explicitly to an outcome like `error`.
- The `try/catch` wrapper in `runAttempt` must absorb lower-level failures to convert them to an `AttemptResult`.
- The `shouldRetryFailure` method must use a TypeScript `switch` block on the discriminated union where any unhandled state fails at compile time (`assertNever` or explicit typing).

## Acceptance Criteria

- When `runShellCommand` fails (either synchronously or via rejection), `runAttempt` returns an `AttemptResult` with `outcome: 'error'`.
- `executeRetry` does not crash when encountering process start failures; it retries according to policy.
- `shouldRetryFailure` in `src/domain/policy.ts` uses an exhaustive `switch` that causes compiler errors if new `AttemptOutcome` variants are added without policy definitions.

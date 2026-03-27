---
label: "refacts"
implementation_ready: false
---

## Goal

Consistently separate operational/infrastructure errors (which should throw and fail the action fast) from domain errors (like command execution returning a non-zero exit code or timing out, which should be modeled as Result unions and appropriately retried based on policy).

## Problem

Mixed failure semantics and swallowed infrastructure errors. The application boundary catches framework and JS-level errors (like `TypeError` or process spawn failures) and coerces them into a domain-level failure (`outcome: 'error'`). This causes unrecoverable infrastructure bugs to be treated as command failures, which incorrectly triggers the retry policy.

When a system mixes infrastructure errors (like `ENOENT` on process spawn or an undefined reference in the JS code) with domain results (the external script exited with a code), it becomes impossible to distinguish between a bug in the action itself versus a failure of the payload. The `catch (error)` in `executeAttempt` currently swallows actual JS errors and forces them into a default `AttemptResult` return value. As a result, the action will attempt to retry an unrecoverable failure, hiding the missing stack trace and preventing fast-failure.

## Evidence

- source_event: "mixed_failure_semantics_typescripter.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "53-63"
  note: "A blanket `catch (error)` captures all exceptions and coerces them into `{ outcome: 'error', exitCode: null }`, meaning runtime JS exceptions are treated as command failures and will be retried."

- source_event: "mixed_failure_semantics_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "35-37"
  note: "Throws a raw `Error` (`Unexpected timeout...`) instead of returning a failure result, mixing throw-based and return-based error handling within the same async operation."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`

## Constraints

- Domain outcomes (e.g. valid non-zero exit codes) must not crash the Github Action.
- Real JS errors or uncaught OS errors should surface stack traces for debugging.

## Acceptance Criteria

- The blanket `catch (error)` that turns runtime exceptions into `{ outcome: 'error' }` is replaced with precise handling.
- Operational exceptions cause the process to fail fast rather than being retried by the policy.

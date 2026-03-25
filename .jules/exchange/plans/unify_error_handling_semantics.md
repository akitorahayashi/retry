---
label: "bugs"
---

## Goal

Standardize failure semantics in the execution domain by explicitly handling all asynchronous/uncaught errors to eliminate silent fallbacks and ensure retry loops properly process the outcomes.

## Current State

- `src/app/execute-retry/execute-attempt.ts`: Execution logic inside `executeAttempt` currently lacks a `catch` block on `runShellCommand`, allowing synchronous or unhandled process errors to bypass the structured domain `AttemptResult` return entirely. This skips the intended retry logic on unexpected spawn errors.
- `src/adapters/run-shell-command.ts`: When stdout and stderr fail to pipe properly, the resulting error is caught and swallowed by an empty `catch` block (lines 36-39, 44-47). This creates an observable silent fallback where logs may quietly drop.
- `src/adapters/terminate-process-tree.ts`: Process termination on `kill` employs multiple empty `catch` blocks (lines 15-19), swallowing real errors when attempting to resolve a process signal mismatch or group missing.

## Plan

1. In `src/app/execute-retry/execute-attempt.ts`, surround the execution resolution logic (`dependencies.runCommand` and `awaitAttemptOutcome`) with a `try...catch` block. Coerce any caught exception into an `AttemptResult` with `outcome: 'error'`.
2. In `src/adapters/run-shell-command.ts`, replace empty `catch` blocks in stdout and stderr data handlers. Use an appropriate logger or explicitly handle stream failures without failing the primary command.
3. In `src/adapters/terminate-process-tree.ts`, analyze and handle failures inside `sendSignal` and `isAlive` so that empty `catch` blocks are replaced. Specifically handle typical exceptions such as `ESRCH` explicitly rather than generically swallowing all errors.

## Acceptance Criteria

- `executeAttempt` returns a structured `AttemptResult` with `outcome: 'error'` when `dependencies.runCommand` throws.
- Empty `catch` blocks in `src/adapters/run-shell-command.ts` and `src/adapters/terminate-process-tree.ts` are eliminated.
- Unit tests verify the new error-handling boundary constraints and retry flow semantics.

## Risks

- Explicit error logging/handling on `kill` or stream pipelines might flood standard output under certain conditions.
- Wrapping the primary async execution loop may unintentionally catch non-recoverable errors if not properly restricted, potentially masking severe system faults.

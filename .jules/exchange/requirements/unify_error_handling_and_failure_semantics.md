---
label: "bugs"
implementation_ready: false
---

## Goal

Standardize failure semantics in the execution domain by adopting a consistent failure mode so all retry-eligible errors are returned as structured domain failures rather than silently bypassing retries as uncaught exceptions, and eliminate silent fallbacks by explicitly handling or logging swallowed exceptions.

## Problem

The codebase mixes Result-style error handling (returning `AttemptResult` with `outcome: 'error'`) with uncaught thrown exceptions from `runShellCommand`, bypassing the explicit `outcome` structure and skipping the retry loop logic entirely. Additionally, empty `catch` blocks in standard error handling locations (e.g. `runShellCommand.ts` and `terminateProcessTree.ts`) swallow failures silently, violating failure visibility principles and anti-patterns regarding swallowed exceptions.

## Evidence

- source_event: "inconsistent_failure_semantics_typescripter.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "30-46"
  note: "Mixes Result-style returns with potential uncaught exceptions from runShellCommand. No catch block is present to coerce generic throws into an error state."

- source_event: "inconsistent_failure_semantics_typescripter.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "30"
  note: "runShellCommand can throw synchronously if the spawn wrapper encounters an issue (e.g. child.pid not defined)."

- source_event: "swallowed_errors_typescripter.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "36-39"
  note: "An empty catch block swallows errors when stdout stream writes fail."

- source_event: "swallowed_errors_typescripter.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "44-47"
  note: "An empty catch block swallows errors when stderr stream writes fail."

- source_event: "swallowed_errors_typescripter.md"
  path: "src/adapters/terminate-process-tree.ts"
  loc: "15-19"
  note: "An empty catch block swallows failures on `process.kill(-pid, signal)`, and another empty block follows for `process.kill(pid, signal)`."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/adapters/run-shell-command.ts`
- `src/adapters/terminate-process-tree.ts`

## Constraints

- Async APIs must have a consistent failure mode.
- Caught errors must not be swallowed; fallbacks must be explicit, opt-in, and surfaced as failures or clearly logged.

## Acceptance Criteria

- `executeAttempt` wraps execution logic in a `try...catch` block to map all exceptions into a structured `AttemptResult` with `outcome: 'error'`.
- All empty `catch` blocks in `runShellCommand.ts` and `terminateProcessTree.ts` either log errors, rethrow them, or otherwise appropriately and visibly handle the failure condition.

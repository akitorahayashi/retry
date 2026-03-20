---
label: "tests"
implementation_ready: false
---

## Goal

Add tests to ensure `runShellCommand` correctly manages error handling paths, stream events (or ignoring those stream events), and process termination guarantees.

## Problem

Edge cases and failure modes in `runShellCommand` (`src/adapters/run-shell-command.ts`) are untested, including spawn failures, missing PIDs, and potential data-forwarding errors. This leaves critical failure paths unexercised.

## Evidence

- source_event: "untested_run_shell_command_failures_cov.md"
  path: "src/adapters/run-shell-command.ts"
  loc: "24-48"
  note: "Error blocks for throwing on a missing PID, ignoring stdout/stderr exceptions, and catching `error` events are not tested."
- source_event: "untested_run_shell_command_failures_cov.md"
  path: "tests/adapters/run-shell-command.test.ts"
  loc: "1-41"
  note: "Existing tests do not assert failure paths when spawn completely fails, nor what occurs if writing output fails unexpectedly."

## Change Scope

- `src/adapters/run-shell-command.ts`
- `tests/adapters/run-shell-command.test.ts`

## Constraints

- Test assertions must specifically cover the `.on('error', ...)` stream events.
- Child process mocks must be constructed in a way that allows injecting a spawn failure.

## Acceptance Criteria

- Tests exist and pass for a completely failed `spawn` call that throws.
- Tests exist and pass for an asynchronous `error` event emitted by the child process after spawn.
- Tests exist and pass asserting that exceptions thrown by `process.stdout.write` or `process.stderr.write` do not crash the entire execution block.

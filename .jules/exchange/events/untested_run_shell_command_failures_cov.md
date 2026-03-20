---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

Edge cases and failure modes in `runShellCommand` (`src/adapters/run-shell-command.ts`) are untested, including spawn failures, missing PIDs, and potential data-forwarding errors.

## Goal

Add tests to ensure `runShellCommand` correctly manages error handling paths, stream events (or ignoring those stream events), and process termination guarantees.

## Context

The `runShellCommand` adapter spawns the main child process, pipes output streams, and resolves the returned Promise with exit outcomes. The code explicitly attempts to handle missing `child.pid` or `error` events during execution, as well as ignoring exceptions writing to `stdout`/`stderr`. These critical sections of the adapter are entirely unexercised by current test paths.

## Evidence

- path: "src/adapters/run-shell-command.ts"
  loc: "24-48"
  note: "Error blocks for throwing on a missing PID, ignoring stdout/stderr exceptions, and catching `error` events are not tested."
- path: "tests/adapters/run-shell-command.test.ts"
  loc: "1-41"
  note: "Existing tests do not assert failure paths when spawn completely fails, nor what occurs if writing output fails unexpectedly."

## Change Scope

- `src/adapters/run-shell-command.ts`
- `tests/adapters/run-shell-command.test.ts`

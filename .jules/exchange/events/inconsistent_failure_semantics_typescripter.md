---
label: "bugs" # Must match a key in .jules/github-labels.json
created_at: "2026-03-25"
author_role: "typescripter"
confidence: "high"
---

## Problem

`executeAttempt` mixes Result-style error handling (returning `AttemptResult` with `outcome: 'error'`) with uncaught thrown exceptions from `runShellCommand`. Errors that bypass the explicit `outcome` structure skip the retry loop logic entirely.

## Goal

Standardize failure semantics in the execution domain by adopting a consistent failure mode so all retry-eligible errors are returned as structured domain failures rather than silently bypassing retries as uncaught exceptions.

## Context

According to First Principles: "Failures are part of the API: pick a strategy and keep it consistent within a layer", and "Do async APIs have a consistent failure mode (throw vs Result vs undefined)...". `executeAttempt` implements a clear Result-style outcome return type, `AttemptResult`, with error and timeout states. However, `runShellCommand` (and `spawn`) can throw synchronously or asynchronously via events. The `try...finally` block in `executeAttempt` ensures signal handlers are cleaned up, but does not `catch` errors. This means standard exceptions skip the structured `outcome: 'error'` mapping and are bubbled up, completely defeating the retry policy for those failure modes.

## Evidence

- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "30-46"
  note: "Mixes Result-style returns with potential uncaught exceptions from runShellCommand. No catch block is present to coerce generic throws into an error state."

- path: "src/adapters/run-shell-command.ts"
  loc: "30"
  note: "runShellCommand can throw synchronously if the spawn wrapper encounters an issue (e.g. child.pid not defined)."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/adapters/run-shell-command.ts`

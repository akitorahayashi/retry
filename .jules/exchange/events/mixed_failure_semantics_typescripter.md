---
label: "bugs"
created_at: "2024-05-24"
author_role: "typescripter"
confidence: "high"
---

## Problem

`runShellCommand` and `runAttempt` mix exceptions (thrown synchronously or rejected asynchronously) with domain object returns (`AttemptResult`), causing system-level errors to bypass the retry loop and crash the action instead of resolving into an `error` outcome.

## Goal

Unify failure handling in `runAttempt` so that all command failures (both synchronous start failures and asynchronous rejections) resolve into a valid `AttemptResult` domain object.

## Context

The `executeRetry` function expects `runAttempt` to return an `AttemptResult`. However, if `dependencies.runCommand` throws (e.g., failed to start process) or if `running.completion` rejects, these errors bypass the retry logic, crashing the entire GitHub Action execution instead of triggering a retry for `error`.

## Evidence

- path: "src/adapters/run-shell-command.ts"
  loc: "line 21-23"
  note: "Throws a synchronous exception if process start fails."
- path: "src/adapters/run-shell-command.ts"
  loc: "line 42-45"
  note: "Rejects the completion promise on child process error."
- path: "src/app/execute-retry.ts"
  loc: "line 164"
  note: "Awaits the completion promise without a try/catch, causing rejections to bubble out of `runAttempt`."

## Change Scope

- `src/adapters/run-shell-command.ts`
- `src/app/execute-retry.ts`

---
label: "refacts"
created_at: "2024-05-25"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The concept of an execution's result or outcome is represented by multiple overlapping terms: `AttemptOutcome` (domain), `AttemptResult` (domain), and `ExecutionResult` (app).

- `AttemptOutcome` is a union of string literals: `'success' | 'error' | 'timeout'`.
- `AttemptResult` includes `attempt`, `outcome`, `exitCode`, and `stdout`.
- `ExecutionResult` includes `outcome`, `exitCode`, and `stdout`, missing the `attempt` number.

`ExecutionResult` is essentially a partial `AttemptResult` returned by `awaitAttemptOutcome`. The naming makes the boundary between the command's raw completion and the domain's tracked attempt confusing.

## Goal

Unify or clearly delineate the vocabulary for the outcome of a command execution vs. the result of a retry attempt.

## Context

Having `AttemptOutcome` (a string), `AttemptResult` (an object including the attempt number), and `ExecutionResult` (an object without the attempt number) makes it hard to discuss "the result of running the command." The domain currently owns `AttemptOutcome` and `AttemptResult`. The application layer introduces `ExecutionResult` purely because `awaitAttemptOutcome` doesn't know (or doesn't include) the attempt number until the caller (`executeAttempt`) merges it in.

## Evidence

- path: "src/domain/policy.ts"
  loc: "line 1"
  note: "Defines `AttemptOutcome` as a string literal union."

- path: "src/domain/result.ts"
  loc: "line 1"
  note: "Defines `AttemptResult` as an object containing `outcome` (an `AttemptOutcome`)."

- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "line 15"
  note: "Defines `ExecutionResult` which is nearly identical to `AttemptResult` but lacks the `attempt` field."

## Change Scope

- `src/domain/policy.ts`
- `src/domain/result.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`

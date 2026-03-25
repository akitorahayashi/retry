---
label: "refacts" # Must match a key in .jules/github-labels.json
created_at: "2026-03-25"
author_role: "typescripter"
confidence: "high"
---

## Problem

`AttemptExecutionOutcome` uses a flat interface with nullable fields (`exitCode: number | null`) instead of a discriminated union to represent distinct states like success, error, and timeout. This requires call sites to perform defensive runtime checks.

## Goal

Model state as discriminated unions to make invalid states unrepresentable and enable the compiler to enforce exhaustive checks at boundaries.

## Context

First Principles state: "Make invalid states unrepresentable: model state as discriminated unions, not flags". And: "State modeled with discriminated unions (exhaustive switches; invalid states unrepresentable)". In `src/app/execute-retry/await-attempt-outcome.ts`, `AttemptExecutionOutcome` is:
```typescript
interface AttemptExecutionOutcome {
  outcome: AttemptOutcome // 'success' | 'error' | 'timeout'
  exitCode: number | null
  stdout: string
}
```
This forces the caller `executeAttempt` to perform defensive checks, such as verifying `result.exitCode === null` on a `'success'` outcome, because the type system cannot guarantee that a successful outcome always has a numeric exit code.

## Evidence

- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "15-19"
  note: "Defines AttemptExecutionOutcome as a flat interface with nullable exitCode, allowing invalid states like outcome='success' and exitCode=null."

- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "40-42"
  note: "Call site in executeAttempt is forced to throw a runtime error if exitCode is null for a successful outcome."

## Change Scope

- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`

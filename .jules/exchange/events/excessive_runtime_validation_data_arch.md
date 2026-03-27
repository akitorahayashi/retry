---
label: "refacts"
created_at: "2024-03-27"
author_role: "data_arch"
confidence: "high"
---

## Problem

Excessive and theoretically unreachable runtime validation exists where static types already enforce invariants.

## Goal

Remove defensive runtime checks that the type system statically prevents.

## Context

The `awaitAttemptOutcome` function returns a discriminated union `ExecutionResult`. When the `outcome` discriminant is `'success'`, the type system guarantees that `exitCode` is a `number`, not `null`. However, `executeAttempt` includes defensive runtime validation checking `result.exitCode === null` when `result.outcome === 'success'`, throwing an exception. This indicates a mistrust of the boundary contract and violates the principle of letting invariants be enforced natively by types.

## Evidence

- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "44-48"
  note: "Defensive `if (result.exitCode === null)` runtime check throwing an Error despite `result.outcome === 'success'` narrowing."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "14-17"
  note: "The type `ExecutionResult` guarantees `exitCode: number` when `outcome: 'success'`."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`

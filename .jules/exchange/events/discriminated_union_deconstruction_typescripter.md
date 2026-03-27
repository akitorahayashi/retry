---
label: "refacts"
created_at: "2024-05-16"
author_role: "typescripter"
confidence: "high"
---

## Problem

Deconstruction of discriminated union allows unrepresentable states at the policy boundary. The `shouldRetryFailure` function splits the `AttemptResult` (a discriminated union) into independent `outcome` and `exitCode` primitives, discarding the type safety provided by the union and enabling unrepresentable states to be expressed in parameter inputs.

## Goal

Pass the discriminated union (`AttemptResult` or a similar dedicated union) directly to functions that evaluate state, maintaining exhaustive compiler checks and preventing invalid combinations from being representable.

## Context

A core typescript principle is to model state as discriminated unions so that invalid states are unrepresentable. By destructing the type-safe `AttemptResult` union back into separate primitive variables (like an outcome string and a nullable exitCode number), functions are forced to trust that their callers aren't providing mismatched pairs (e.g. `outcome: 'timeout', exitCode: 1`), and the compiler cannot protect the domain boundary.

## Evidence

- path: "src/domain/policy.ts"
  loc: "6-10"
  note: "`shouldRetryFailure` takes `outcome: AttemptOutcome` and `exitCode: number | null` independently instead of maintaining the strict relationship."
- path: "src/app/execute-retry/index.ts"
  loc: "38"
  note: "The type-safe `finalAttempt` union is destructured to call `shouldRetryFailure`, discarding the union's integrity at the function boundary."

## Change Scope

- `src/domain/policy.ts`
- `src/app/execute-retry/index.ts`

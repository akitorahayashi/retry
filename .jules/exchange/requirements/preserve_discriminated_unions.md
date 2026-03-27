---
label: "refacts"
implementation_ready: false
---

## Goal

Pass the discriminated union (`AttemptResult` or a similar dedicated union) directly to functions that evaluate state, maintaining exhaustive compiler checks and preventing invalid combinations from being representable.

## Problem

Deconstruction of discriminated union allows unrepresentable states at the policy boundary. The `shouldRetryFailure` function splits the `AttemptResult` (a discriminated union) into independent `outcome` and `exitCode` primitives, discarding the type safety provided by the union and enabling unrepresentable states to be expressed in parameter inputs. By destructing the type-safe `AttemptResult` union back into separate primitive variables, functions are forced to trust that their callers aren't providing mismatched pairs, and the compiler cannot protect the domain boundary.

## Evidence

- source_event: "discriminated_union_deconstruction_typescripter.md"
  path: "src/domain/policy.ts"
  loc: "6-10"
  note: "`shouldRetryFailure` takes `outcome: AttemptOutcome` and `exitCode: number | null` independently instead of maintaining the strict relationship."

- source_event: "discriminated_union_deconstruction_typescripter.md"
  path: "src/app/execute-retry/index.ts"
  loc: "38"
  note: "The type-safe `finalAttempt` union is destructured to call `shouldRetryFailure`, discarding the union's integrity at the function boundary."

## Change Scope

- `src/domain/policy.ts`
- `src/app/execute-retry/index.ts`

## Constraints

- Refactoring `shouldRetryFailure` must not alter existing retry logic logic beyond function signatures.

## Acceptance Criteria

- `shouldRetryFailure` directly accepts a discriminated union.
- Destructuring of state into disparate variables before domain rule evaluation is eliminated.

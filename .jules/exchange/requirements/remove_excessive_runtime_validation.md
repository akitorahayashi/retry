---
label: "refacts"
implementation_ready: true
---

## Goal

Remove defensive runtime checks that the type system statically prevents.

## Problem

Excessive and theoretically unreachable runtime validation exists where static types already enforce invariants. The `awaitAttemptOutcome` function returns a discriminated union `ExecutionResult`. When the `outcome` discriminant is `'success'`, the type system guarantees that `exitCode` is a `number`, not `null`. However, `executeAttempt` includes defensive runtime validation checking `result.exitCode === null` when `result.outcome === 'success'`, throwing an exception. This indicates a mistrust of the boundary contract and violates the principle of letting invariants be enforced natively by types.

## Evidence

- source_event: "excessive_runtime_validation_data_arch.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "44-48"
  note: "Defensive `if (result.exitCode === null)` runtime check throwing an Error despite `result.outcome === 'success'` narrowing."

- source_event: "excessive_runtime_validation_data_arch.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "14-17"
  note: "The type `ExecutionResult` guarantees `exitCode: number` when `outcome: 'success'`."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`

## Constraints

- Do not alter the existing static type definitions (`ExecutionResult` etc.)

## Acceptance Criteria

- The unnecessary check `if (result.exitCode === null)` inside the `'success'` outcome handler is removed.
- Valid TypeScript compilation confirms that the check is indeed superfluous.

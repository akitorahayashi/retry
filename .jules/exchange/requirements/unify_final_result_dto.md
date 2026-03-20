---
label: "refacts"
implementation_ready: true
---

## Goal

Eliminate duplicate data structures for execution outcomes by defining a single canonical domain object (`FinalResult`), eliminating `RetryActionOutput`, and decoupling the command execution core (`runAttempt`) from the transport-specific `RetryRequest` DTO by defining a `CommandExecution` domain object.

## Problem

The result of the action execution is modeled twice: once as `FinalResult` in the domain logic, and once as `RetryActionOutput` in the action output logic. Furthermore, the `RetryRequest` transport DTO is leaking into the application core logic, specifically being passed into the `runAttempt` execution function.

## Evidence

- source_event: "duplicate_final_result_type_data_arch.md"
  path: "src/domain/result.ts"
  loc: "9-14"
  note: "Defines `FinalResult`."
- source_event: "duplicate_final_result_type_data_arch.md"
  path: "src/action/emit-outputs.ts"
  loc: "3-8"
  note: "Defines `RetryActionOutput` which structurally duplicates `FinalResult`, including a hardcoded inline union for `finalOutcome` instead of reusing `AttemptOutcome`."
- source_event: "duplicate_final_result_type_data_arch.md"
  path: "src/index.ts"
  loc: "9"
  note: "Passes `result` of type `FinalResult` implicitly as `RetryActionOutput` to `emitOutputs`."
- source_event: "duplicate_result_type_taxonomy.md"
  path: "src/domain/result.ts"
  loc: "9-14"
  note: "Defines the `FinalResult` interface representing the final execution state."
- source_event: "duplicate_result_type_taxonomy.md"
  path: "src/action/emit-outputs.ts"
  loc: "3-8"
  note: "Defines the structurally identical `RetryActionOutput` interface, duplicating the concept under a new name."
- source_event: "duplicate_result_type_taxonomy.md"
  path: "src/index.ts"
  loc: "8"
  note: "Passes the `result` (of type `FinalResult`) directly to `emitOutputs` (which expects `RetryActionOutput`), proving they represent the exact same concept."
- source_event: "transport_dto_leak_data_arch.md"
  path: "src/app/execute-retry.ts"
  loc: "93"
  note: "`runAttempt` takes `RetryRequest` directly instead of a domain-specific model for the command execution."
- source_event: "transport_dto_leak_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "5-16"
  note: "Defines `RetryRequest`, which mixes execution instructions with GitHub Action-specific configurations."

## Change Scope

- `src/domain/result.ts`
- `src/action/emit-outputs.ts`
- `src/index.ts`
- `src/app/execute-retry.ts`
- `src/action/read-inputs.ts`

## Constraints

- There must be a single source of truth for the execution output structure and outcome types.
- The `app` domain must not depend on `action` (transport layer) types.

## Acceptance Criteria

- `RetryActionOutput` is removed from `emit-outputs.ts` and `emitOutputs` accepts `FinalResult`.
- `AttemptOutcome` from `result.ts` is the single source of truth for outcome states.
- `runAttempt` no longer takes a `RetryRequest` parameter, using a properly scoped domain object instead.
- Static type checks pass with the single unified definition.

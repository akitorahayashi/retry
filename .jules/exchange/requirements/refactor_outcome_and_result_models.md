---
label: "refacts"
implementation_ready: false
---

## Goal

Refactor the Outcome and Result models to enforce a canonical distinction between immediate categorical states ("Outcome") and structured envelopes ("Result"), ensuring invalid states are unrepresentable by using discriminated unions instead of flat nullable properties, and to remove GitHub Action specific transport DTO representations (`FinalResult`) from the domain layer.

## Problem

The terms "outcome" and "result" are used ambiguously across the codebase. `AttemptExecutionOutcome` incorrectly functions as a structured result despite its name, and is modeled as a flat interface with nullable fields (`exitCode: number | null`) instead of a discriminated union, allowing invalid states (e.g., success with no exit code). Concurrently, the domain layer defines `FinalResult` (and `toFinalResult`) which maps directly to GitHub Action outputs, coupling core domain logic to transport concerns. These issues violate Boundary Sovereignty and principle constraints regarding unrepresentable invalid states and precise domain terminology.

## Evidence

- source_event: "inconsistent_naming_outcome_result_taxonomy.md"
  path: "src/domain/policy.ts"
  loc: "Line 1: export type AttemptOutcome = 'success' | 'error' | 'timeout'"
  note: "Defines 'Outcome' as a literal categorical state."

- source_event: "inconsistent_naming_outcome_result_taxonomy.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "Line 15: interface AttemptExecutionOutcome { outcome: AttemptOutcome; exitCode: number | null; stdout: string }"
  note: "Uses 'Outcome' in the interface name for a structure that is conceptually a 'Result' and contains an 'outcome' property."

- source_event: "inconsistent_naming_outcome_result_taxonomy.md"
  path: "src/domain/result.ts"
  loc: "Line 25: finalOutcome: 'success'"
  note: "Prefixes 'Outcome' with 'final' inside 'FinalResult', making the property name shape inconsistent."

- source_event: "non_exhaustive_execution_outcome_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "15-19"
  note: "Defines AttemptExecutionOutcome as a flat interface with nullable exitCode, allowing invalid states like outcome='success' and exitCode=null."

- source_event: "non_exhaustive_execution_outcome_typescripter.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "40-42"
  note: "Call site in executeAttempt is forced to throw a runtime error if exitCode is null for a successful outcome."

- source_event: "redundant_final_result_transport_dto_data_arch.md"
  path: "src/domain/result.ts"
  loc: "FinalResult"
  note: "Defines a type with 'final'-prefixed fields and a 'succeeded' boolean that mirror GitHub Action outputs."

- source_event: "redundant_final_result_transport_dto_data_arch.md"
  path: "src/domain/result.ts"
  loc: "toFinalResult"
  note: "Performs an inefficient transformation solely to rename fields and derive 'succeeded'."

- source_event: "redundant_final_result_transport_dto_data_arch.md"
  path: "src/action/emit-outputs.ts"
  loc: "emitOutputs"
  note: "Consumes the domain's FinalResult rather than receiving the domain model and performing the transport mapping itself."

## Change Scope

- `src/domain/result.ts`
- `src/domain/policy.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/index.ts`
- `src/app/execute-retry/execute-attempt.ts`
- `src/action/emit-outputs.ts`
- `src/index.ts`

## Constraints

- Domain models must be independent of transport or UI concerns.
- State must be modeled with discriminated unions to ensure exhaustive switches and make invalid states unrepresentable.
- Enforce the conceptual distinction: "Outcome" is a categorical classification, "Result" is a structural envelope.

## Acceptance Criteria

- `AttemptExecutionOutcome` is renamed to reflect its nature as a result.
- The outcome state (e.g. success, error, timeout) is represented using discriminated unions, removing nullable fields like `exitCode: number | null` from success states.
- `FinalResult` and `toFinalResult` are removed from `src/domain/result.ts`.
- Transport-specific mapping for outputs is handled directly within the action layer (`src/action/emit-outputs.ts` or similar).

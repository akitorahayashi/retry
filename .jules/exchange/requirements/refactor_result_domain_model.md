---
label: "refacts"
implementation_ready: false
---

## Goal

Align the naming of result properties between the single-attempt view, the final aggregate view, and the user-facing action outputs. Refactor `AttemptResult` and `FinalResult` into discriminated unions keyed by `outcome` (or `finalOutcome`), making invalid states unrepresentable. The redundant `succeeded` flag should be removed from the domain model and derived only when needed at the transport/action layer.

## Problem

The terms `outcome` and `exitCode` are defined distinctly at the attempt level (`AttemptResult`), but are mapped to `finalOutcome` and `finalExitCode` in the `FinalResult` aggregate, and further as `final_outcome` and `final_exit_code` in the GitHub Action outputs. However, the action outputs are defined simply as `attempts` and `succeeded`, creating inconsistent prefixing. `AttemptResult` and `FinalResult` use flat interfaces that encode state with a string (`outcome`) alongside nullable properties (`exitCode: number | null`) and redundant flags (`succeeded: boolean`). This allows invalid state combinations to be represented, such as a `'success'` outcome with an `exitCode` of `null` and `succeeded: false`.

## Context

The `AttemptResult` domain model uses `outcome` and `exitCode`. The `FinalResult` uses `finalOutcome` and `finalExitCode`. However, the final result also includes `attempts` and `succeeded` which don't have the `final` prefix, despite representing the final state. This prefixing leaks into the user-facing outputs (`final_exit_code`, `final_outcome` vs `attempts`, `succeeded`), making the API inconsistent. If it's a "final" state, either all properties should indicate it, or none should, relying on the context (the output of the action) to imply finality. TypeScript's discriminated unions provide compiler-enforced state exhaustiveness and prevent unrepresentable states. Using flat interfaces with nullable fields and boolean flags forces consumers to guess if combinations like `outcome: 'success'` and `exitCode: null` are possible, violating the principle of making invalid states unrepresentable.

## Evidence

- source_event: "outcome_property_shadowing_taxonomy.md"
  path: "src/domain/result.ts"
  loc: "lines 4-6"
  note: "`AttemptResult` properties: `attempt`, `outcome`, `exitCode`"
- source_event: "outcome_property_shadowing_taxonomy.md"
  path: "src/domain/result.ts"
  loc: "lines 9-13"
  note: "`FinalResult` properties: `attempts`, `finalExitCode`, `finalOutcome`, `succeeded`"
- source_event: "outcome_property_shadowing_taxonomy.md"
  path: "action.yml"
  loc: "lines 40-47"
  note: "Action outputs: `attempts`, `final_exit_code`, `final_outcome`, `succeeded`"
- source_event: "outcome_property_shadowing_taxonomy.md"
  path: "src/index.ts"
  loc: "line 14"
  note: "Log string uses mixed prefixing: `final_outcome`, `final_exit_code`"
- source_event: "flat_state_encoding_in_results_typescripter.md"
  path: "src/domain/result.ts"
  loc: "3-8"
  note: "`AttemptResult` encodes outcome as a string and allows `exitCode: number | null` across all outcomes, which means success can erroneously have a null exit code."
- source_event: "flat_state_encoding_in_results_typescripter.md"
  path: "src/domain/result.ts"
  loc: "9-14"
  note: "`FinalResult` includes a redundant `succeeded` boolean alongside `finalOutcome`, allowing conflicting combinations."

## Change Scope

- `README.md`
- `action.yml`
- `src/action/emit-outputs.ts`
- `src/app/execute-retry/index.ts`
- `src/domain/result.ts`
- `src/index.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

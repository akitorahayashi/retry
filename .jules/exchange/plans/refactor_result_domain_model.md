---
label: "refacts"
---

## Goal

Align the naming of result properties between the single-attempt view, the final aggregate view, and the user-facing action outputs. Refactor `AttemptResult` and `FinalResult` into discriminated unions keyed by `outcome`, making invalid states unrepresentable. The redundant `succeeded` flag should be removed from the domain model and derived only when needed at the transport/action layer.

## Current State

The current state allows invalid property combinations to be represented and uses inconsistent naming for final properties.
- `src/domain/result.ts`: Defines `AttemptResult` and `FinalResult` as flat interfaces. `FinalResult` renames `outcome` to `finalOutcome` and `exitCode` to `finalExitCode` and duplicates success state in `succeeded`. These states allow invalid combinations like `outcome: 'success'` and `exitCode: null`.
- `tests/domain/result.test.ts`: Tests `toFinalResult` against the flat, redundant `FinalResult` structure.
- `action.yml`: Outputs duplicate information via `final_outcome`, `final_exit_code` and `succeeded`.
- `src/action/emit-outputs.ts`: Translates flat `FinalResult` to action outputs, reading `finalOutcome`, `finalExitCode`, and `succeeded`.
- `src/app/execute-retry/index.ts`: Directly reads `finalOutcome` and `finalExitCode` on `FinalResult` to log the reason for failure.
- `src/index.ts`: Logs string uses mixed prefixing for `final_outcome` and `final_exit_code` along with `succeeded`.
- `README.md`: Documents `final_exit_code`, `final_outcome` and `succeeded` as outputs.

## Plan

1. Refactor `src/domain/result.ts` to use discriminated unions for both `AttemptResult` and `FinalResult`. Remove the `final` prefix from properties in `FinalResult` and remove the `succeeded` boolean flag.
2. Update `action.yml` to rename `final_exit_code` to `exit_code` and `final_outcome` to `outcome` to remove the inconsistent `final_` prefix.
3. Update `src/action/emit-outputs.ts` to map the new domain model to the correct output names, calculating `succeeded` dynamically from `outcome === 'success'`.
4. Update `src/app/execute-retry/index.ts` and `src/index.ts` to reflect the renamed properties `outcome` and `exitCode` on `FinalResult`.
5. Update `tests/domain/result.test.ts` to expect the new structure of `FinalResult` without `final` prefixes and without `succeeded`.
6. Update `README.md` to reflect the updated output names `exit_code` and `outcome`.

## Acceptance Criteria

- `AttemptResult` and `FinalResult` are discriminated unions keyed by `outcome` without redundant boolean flags.
- Action outputs drop the `final_` prefix for consistency with `attempts` and `succeeded`.
- Tests pass and coverage is maintained or improved.

## Risks

- Action outputs are renamed, which breaks existing users relying on `final_outcome` and `final_exit_code`.
- Changes to `AttemptResult` might affect existing tests or implementations that assume flat objects.

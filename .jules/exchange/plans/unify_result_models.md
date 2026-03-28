---
label: "refacts"
---

## Goal

Unify the representations of execution outcomes into a single domain concept (`AttemptResult`), eliminating overlapping terminology (`ExecutionResult`) and redundant mappings. Consolidate `AttemptOutcome` and `AttemptResult` into the same domain module.

## Current State

The concept of an execution's result or outcome is represented by multiple overlapping and redundant terms across layers: `AttemptOutcome` (domain), `AttemptResult` (domain), and `ExecutionResult` (app). `ExecutionResult` mirrors `AttemptResult` without the attempt number, creating an unnecessary boundary conversion where the application module repackages identical concepts to the domain model without adding meaningful separation.

### Implementation Targets
- `src/domain/policy.ts`: Defines `AttemptOutcome` which is a domain concept related to execution results, not policy.
- `src/app/execute-retry/await-attempt-outcome.ts`: Defines `ExecutionResult` which mirrors `AttemptResult` without the attempt number. `awaitAttemptOutcome` returns this type despite having access to the attempt number.
- `src/app/execute-retry/execute-attempt.ts`: Maps `ExecutionResult` back to `AttemptResult`, creating an explicit conversion between identical state spaces, checking invariants that are already enforced by the type system.

### Tests
- `tests/app/await-attempt-outcome.test.ts`: Tests `awaitAttemptOutcome`, asserting on the redundant `ExecutionResult` shape.
- `tests/app/execute-attempt.test.ts`: Tests `executeAttempt` including logic that handles mappings between `ExecutionResult` and `AttemptResult`.

### Documentation
- `docs/architecture/boundary.md`: Does not explicitly mention `AttemptOutcome` or `ExecutionResult`, but may need conceptual review if terms are surfaced in future docs. Currently, no structural changes required.

## Plan

1. Relocate Domain Types
   - Move the `AttemptOutcome` type from `src/domain/policy.ts` to `src/domain/result.ts` to co-locate the terminology of execution outcomes. Update all dependent imports (`src/app/execute-retry/await-attempt-outcome.ts`, `src/domain/policy.ts`).

2. Eliminate Redundant Type
   - Delete the `ExecutionResult` type from `src/app/execute-retry/await-attempt-outcome.ts`.

3. Update Application Boundary
   - Modify `awaitAttemptOutcome` in `src/app/execute-retry/await-attempt-outcome.ts` to return `AttemptResult` directly, incorporating the `attempt` number into its returned objects.

4. Remove Unnecessary Mapping
   - Simplify `executeAttempt` in `src/app/execute-retry/execute-attempt.ts` to remove the redundant mapping and runtime invariant checks (e.g. success with null exit code), allowing it to directly return the `AttemptResult` from `awaitAttemptOutcome`.

5. Update Tests
   - `tests/app/await-attempt-outcome.test.ts`: Update assertions to include the `attempt` property in the expected outcomes.
   - `tests/app/execute-attempt.test.ts`: Remove tests related to coercing impossible success-with-null-exitCode outcomes, as this is natively prevented by `awaitAttemptOutcome` and the unified `AttemptResult` boundary.

## Acceptance Criteria

- `ExecutionResult` is removed from the codebase.
- `AttemptOutcome` is defined in `src/domain/result.ts` and correctly imported by consumers.
- `awaitAttemptOutcome` returns `AttemptResult`.
- `executeAttempt` directly returns the result of `awaitAttemptOutcome` without manually re-mapping properties.
- Type safety is maintained and tests pass.

## Risks

- Removing the runtime invariant check in `executeAttempt` (success with null exit code) places full trust in `awaitAttemptOutcome`. This is acceptable because `awaitAttemptOutcome`'s internal logic strictly checks for `exitCode === 0` before yielding a `success` outcome, guaranteeing it is not null.

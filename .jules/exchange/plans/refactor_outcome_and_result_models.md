---
label: "refacts"
---

## Goal

Refactor the Outcome and Result models to enforce a canonical distinction between immediate categorical states ("Outcome") and structured envelopes ("Result"). Ensure invalid states are unrepresentable by using discriminated unions instead of flat nullable properties, and remove GitHub Action specific transport DTO representations (`FinalResult`) from the domain layer.

## Current State

The current codebase uses "outcome" and "result" ambiguously, couples core domain logic with transport concerns via `FinalResult`, and models state inappropriately, allowing invalid combinations (e.g. success with `exitCode` null).

- `src/domain/result.ts`: Contains the `FinalResult` interface and `toFinalResult` transformer which couple the domain to action transport outputs (the 'final' and 'succeeded' prefixes mirroring outputs).
- `src/domain/policy.ts`: Defines `AttemptOutcome` as a categorical state (`success`, `error`, `timeout`), correctly distinguishing it from structured results.
- `src/app/execute-retry/await-attempt-outcome.ts`: Contains the `AttemptExecutionOutcome` interface, structurally functioning as a result but named after an outcome. Models `exitCode` as `number | null`, allowing invalid states where a successful attempt is missing an exit code.
- `src/app/execute-retry/execute-attempt.ts`: Because `AttemptExecutionOutcome` is flat, the `executeAttempt` function contains runtime assertions (`if (result.exitCode === null) throw...`) to enforce invariants that should be statically checked by the type system.
- `src/app/execute-retry/index.ts`: Depends heavily on `FinalResult`, coupling the core orchestration logic with transport-specific mappings.
- `src/action/emit-outputs.ts`: Receives the already-transformed `FinalResult`, dodging responsibility for the transport-layer translation.
- `src/index.ts`: Evaluates `result.succeeded` directly off the transport-specific domain return, further coupling entrypoint logic to transport mappings.

## Plan

1. Rename `AttemptExecutionOutcome` to `ExecutionResult` in `src/app/execute-retry/await-attempt-outcome.ts` to reflect its nature as a structured result rather than an outcome.
2. Refactor the newly renamed `ExecutionResult` (and related `AttemptResult`) into a discriminated union keyed on the categorical `outcome` property to eliminate the flat nullable `exitCode` and ensure unrepresentable invalid states (e.g., success outcome with null exit code).
3. Remove `FinalResult` and `toFinalResult` from `src/domain/result.ts` entirely. The domain should communicate strictly using the standard domain result representations (e.g., `AttemptResult`).
4. Modify `src/app/execute-retry/index.ts` to return the canonical domain model (`AttemptResult`) from `executeRetry` rather than translating to `FinalResult`.
5. Update `src/action/emit-outputs.ts` to take `AttemptResult` directly and perform the necessary translation to the required transport/GitHub Action outputs format within the action layer.
6. Update the main entry point `src/index.ts` to interact with `AttemptResult` instead of `FinalResult`, adjusting boolean success evaluations and error formatting.
7. Update `src/app/execute-retry/execute-attempt.ts` to remove the runtime guard for `result.exitCode === null` on successful outcomes, as this is now statically guaranteed by the discriminated union in `ExecutionResult`.
8. Adjust unit tests in `tests/domain/result.test.ts` to account for the deletion of `toFinalResult`.
9. Modify any tests expecting `FinalResult` structures (e.g., in `tests/app/execute-retry/execute-retry.test.ts` or `tests/action/emit-outputs.test.ts`) to conform to the new model boundary.

## Acceptance Criteria

- `AttemptExecutionOutcome` is renamed to reflect its nature as a result.
- The outcome state (e.g. success, error, timeout) is represented using discriminated unions, removing nullable fields like `exitCode: number | null` from success states.
- `FinalResult` and `toFinalResult` are completely removed from the `src/domain/result.ts` module.
- `src/action/emit-outputs.ts` directly performs mapping from the canonical domain model (`AttemptResult`) to the GitHub Actions output structure.
- `executeAttempt` handles `ExecutionResult` statically, avoiding runtime null checks on exit codes for successful attempts.
- All unit and integration tests accurately reflect the domain decoupling and boundary shift.

## Risks

- External systems dependent on specific, undocumented error messages originating from removed runtime assertions in `executeAttempt` might break.
- Modifications to the return type of `executeRetry` and the signature of `emitOutputs` may result in typing conflicts if upstream dependent tests are missed during the refactor.

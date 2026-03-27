---
label: "refacts"
---

## Goal

Pass the discriminated union `AttemptResult` directly to `shouldRetryFailure` to maintain exhaustive compiler checks and prevent invalid combinations from being representable.

## Current State

The `shouldRetryFailure` function splits the `AttemptResult` (a discriminated union) into independent `outcome` and `exitCode` primitives. This discards the type safety provided by the union and enables unrepresentable states to be expressed in parameter inputs. By destructing the type-safe `AttemptResult` union back into separate primitive variables, functions are forced to trust that their callers aren't providing mismatched pairs, and the compiler cannot protect the domain boundary.

- `src/domain/policy.ts`: Defines `shouldRetryFailure` taking `outcome: AttemptOutcome` and `exitCode: number | null` independently instead of maintaining strict relationships.
- `src/app/execute-retry/index.ts`: The type-safe `finalAttempt` union is destructured to call `shouldRetryFailure`, discarding the union's integrity at the function boundary.
- `tests/domain/policy.test.ts`: Tests `shouldRetryFailure` by passing independent `outcome` and `exitCode` primitives rather than constructed `AttemptResult` objects.

## Plan

1. Modify `shouldRetryFailure` in `src/domain/policy.ts` to accept an `AttemptResult` instead of independent `outcome` and `exitCode` parameters.
2. Update the implementation of `shouldRetryFailure` to use properties directly from the `AttemptResult` parameter. Since we are checking if a failure should be retried, the function can process type-safe states directly from the `AttemptResult`.
3. Update the call site in `src/app/execute-retry/index.ts` to pass the entire `finalAttempt` object to `shouldRetryFailure`.
4. Update tests in `tests/domain/policy.test.ts` to pass constructed `AttemptResult` objects instead of independent primitives.

## Acceptance Criteria

- `shouldRetryFailure` directly accepts a discriminated union.
- Destructuring of state into disparate variables before domain rule evaluation is eliminated.
- Refactoring `shouldRetryFailure` must not alter existing retry logic logic beyond function signatures.

## Risks

- Forgetting to update a call site of `shouldRetryFailure` leading to a compilation error.
- Making a mistake in translating the logic of `shouldRetryFailure` resulting in incorrect retry behavior.

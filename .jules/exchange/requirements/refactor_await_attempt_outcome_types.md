---
label: "refacts"
implementation_ready: false
---

## Goal

Define explicit sum types for Promise race outcomes instead of anonymous inline objects and type casting, keeping runtime boundary contracts clear and maintainable. Ensure a consistent failure contract. `executeAttempt` should use typed Result objects (or specific error classes) to handle process initiation/execution errors distinctly from command exit statuses. Swallowing unknown exceptions into a generic failure outcome masks the true cause of failure and prevents proper escalation.

## Problem

Type assertions are used in `awaitAttemptOutcome.ts` (`as const`) to create local discriminants instead of defining a concrete domain boundary or generic result type for process outcomes. The promise race logic constructs inline objects with `type: 'completion' as const` or `type: 'timeout' as const`, creating implicit contracts that aren't statically validated. The core application layer mixes failure semantics. `executeAttempt` wraps domain execution in a try-catch block that swallows unknown errors and coercing them to a safe generic outcome (`outcome: 'error', exitCode: null`). It also handles both standard returns and exceptions inconsistently.

## Context

While `as const` creates a valid type signature, constructing anonymous types locally overcomplicates the module and reduces clarity. Defining a proper sum type (e.g. `type RaceOutcome = { type: 'completion', exitCode: number } | { type: 'timeout' }`) clarifies the possible internal states of `awaitAttemptOutcome` before resolving to `AttemptExecutionOutcome`. Catch blocks that swallow `unknown` errors and coerce them to `any` or generic default domains make debugging impossible and mask systemic failures (e.g. process spawn failure vs command error). The failure mode needs to be explicit, and true runtime exceptions shouldn't be flattened into standard failure paths.

## Evidence

- source_event: "unvalidated_type_assertions_boundary_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "27"
  note: "Uses `type: 'completion' as const` to simulate a discriminant."
- source_event: "unvalidated_type_assertions_boundary_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "44"
  note: "Uses `type: 'timeout' as const` for the timeout branch."
- source_event: "unvalidated_type_assertions_boundary_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "74-78"
  note: "Repeats the same inline object construction during final termination wait."
- source_event: "ambiguous_failure_semantics_in_core_typescripter.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "47-56"
  note: "try-catch block intercepts `error: unknown`, converts the message to string, logs it, and silently returns an `AttemptResult` with `outcome: 'error'`, masking whether the process failed to start or if something else failed."
- source_event: "ambiguous_failure_semantics_in_core_typescripter.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "63-68"
  note: "Similar pattern swallowing `error: unknown` on termination attempts without escalating."

## Change Scope

- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

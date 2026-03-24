---
label: "refacts"
created_at: "2024-03-24"
author_role: "typescripter"
confidence: "medium"
---

## Problem

Type assertions are used in `awaitAttemptOutcome.ts` (`as const`) to create local discriminants instead of defining a concrete domain boundary or generic result type for process outcomes. The promise race logic constructs inline objects with `type: 'completion' as const` or `type: 'timeout' as const`, creating implicit contracts that aren't statically validated.

## Goal

Define explicit sum types for Promise race outcomes instead of anonymous inline objects and type casting, keeping runtime boundary contracts clear and maintainable.

## Context

While `as const` creates a valid type signature, constructing anonymous types locally overcomplicates the module and reduces clarity. Defining a proper sum type (e.g. `type RaceOutcome = { type: 'completion', exitCode: number } | { type: 'timeout' }`) clarifies the possible internal states of `awaitAttemptOutcome` before resolving to `AttemptExecutionOutcome`.

## Evidence

- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "27"
  note: "Uses `type: 'completion' as const` to simulate a discriminant."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "44"
  note: "Uses `type: 'timeout' as const` for the timeout branch."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "74-78"
  note: "Repeats the same inline object construction during final termination wait."

## Change Scope

- `src/app/execute-retry/await-attempt-outcome.ts`

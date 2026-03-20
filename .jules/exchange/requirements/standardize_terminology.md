---
label: "refacts"
implementation_ready: false
---

## Goal

Standardize on consistent naming conventions for core domain concepts across the application and transport boundaries. This includes standardizing on the term `attempt` over `retryIndex` for iteration tracking, and ensuring the fallback delay concept is consistently named (`retryDelaySeconds` or `defaultDelaySeconds`) between inputs and internal domain models.

## Problem

A single concept—the current iteration number of the command execution—is inconsistently referred to as both `attempt` and `retryIndex`. Furthermore, the concept of a fallback delay between attempts is referred to inconsistently across boundaries, mapped as `retryDelaySeconds` at the input boundary and as `defaultDelaySeconds` in the schedule domain.

## Evidence

- source_event: "attempt_vs_retry_terminology_taxonomy.md"
  path: "src/app/execute-retry.ts"
  loc: "49, 79-80"
  note: "The variable `attempt` tracks iteration natively but is re-assigned to the alias `retryIndex` before passing to the schedule domain."
- source_event: "attempt_vs_retry_terminology_taxonomy.md"
  path: "src/domain/schedule.ts"
  loc: "7-8, 10"
  note: "The domain method is named `resolveRetryDelaySeconds` and accepts a parameter `retryIndex`, but internally subtracts 1 since it's actually an attempt count, not a true array index."
- source_event: "attempt_vs_retry_terminology_taxonomy.md"
  path: "src/domain/result.ts"
  loc: "4"
  note: "The concept is consistently named `attempt` inside `AttemptResult`, acting as the canonical term elsewhere."
- source_event: "delay_terminology_taxonomy.md"
  path: "src/action/read-inputs.ts"
  loc: "10, 24-25"
  note: "Defines the property as `retryDelaySeconds` in the `RetryRequest` interface."
- source_event: "delay_terminology_taxonomy.md"
  path: "src/app/execute-retry.ts"
  loc: "44"
  note: "Maps `request.retryDelaySeconds` to the internal schedule's `defaultDelaySeconds`."
- source_event: "delay_terminology_taxonomy.md"
  path: "src/domain/schedule.ts"
  loc: "2, 13"
  note: "Names the property `defaultDelaySeconds` within the `RetrySchedule` interface."

## Change Scope

- `src/domain/schedule.ts`
- `src/app/execute-retry.ts`
- `src/action/read-inputs.ts`
- `src/domain/result.ts`

## Constraints

- Naming consistency must be enforced without altering the runtime behavior.
- Ensure any change to naming is consistently propagated to all consuming components.

## Acceptance Criteria

- The core loop iterant is exclusively tracked and passed as `attempt` in `execute-retry.ts` and `schedule.ts`, without `retryIndex` synonym variables.
- The property representing the fallback delay is consistently named (`retryDelaySeconds` or `defaultDelaySeconds`) across `read-inputs.ts`, `execute-retry.ts`, and `schedule.ts`.
- All tests continue to pass.

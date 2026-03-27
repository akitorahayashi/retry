---
label: "refacts"
implementation_ready: false
---

## Goal

Ensure that "delay" consistently conveys whether it is the user-configured retry delay, the calculated delay for the current attempt, or the primitive wait operation.

## Problem

Configuration keys, internal domain terminology, and output logs lack a consistent naming convention for "delay" concepts. The action input accepts `retry_delay_seconds` and `retry_delay_schedule_seconds` but internally this concept is represented in multiple ways, such as `retryDelaySeconds`, `delaySeconds`, and the `delay` adapter.

The transition from a configured "retry delay schedule" to a specific "delay" for a given attempt is unclear because of mixed naming conventions across the CLI/Config boundary, Domain, App layer, and Infrastructure.

## Evidence

- source_event: "delay_terminology_taxonomy.md"
  path: "src/domain/schedule.ts"
  loc: "lines 1-4"
  note: "Defines `RetrySchedule` with `retryDelaySeconds` and `retryDelayScheduleSeconds`."

- source_event: "delay_terminology_taxonomy.md"
  path: "src/app/execute-retry/index.ts"
  loc: "line 55"
  note: "The application layer resolves this schedule to a `delaySeconds` local variable."

- source_event: "delay_terminology_taxonomy.md"
  path: "src/adapters/delay.ts"
  loc: "line 1"
  note: "The infrastructure provides a `delay` primitive."

## Change Scope

- `src/domain/schedule.ts`
- `src/app/execute-retry/index.ts`

## Constraints

- Naming changes must be compatible with existing configuration keys (`retry_delay_seconds`, `retry_delay_schedule_seconds`).

## Acceptance Criteria

- Clear distinctions are made between user-configured retry delay, per-attempt calculated delay, and the delay wait operation.
- Terminology for delay is consistent within the Domain, App, and Infrastructure layers.

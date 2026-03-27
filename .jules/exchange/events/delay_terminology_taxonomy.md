---
label: "refacts"
created_at: "2024-05-25"
author_role: "taxonomy"
confidence: "high"
---

## Problem

Configuration keys, internal domain terminology, and output logs lack a consistent naming convention for "delay" concepts.

The action input accepts `retry_delay_seconds` and `retry_delay_schedule_seconds` but internally this concept is represented in multiple ways, such as `retryDelaySeconds`, `delaySeconds`, and the `delay` adapter.

## Goal

Ensure that "delay" consistently conveys whether it is the user-configured retry delay, the calculated delay for the current attempt, or the primitive wait operation.

## Context

The concept of a delay appears at the CLI/Config boundary (as `retry_delay_seconds`), in the Domain (as `RetrySchedule.retryDelaySeconds`), in the App layer (`delaySeconds`), and in the Infrastructure (`delay` function). It is crucial that the transition from a configured "retry delay schedule" to a specific "delay" for a given attempt is clear.

## Evidence

- path: "src/domain/schedule.ts"
  loc: "lines 1-4"
  note: "Defines `RetrySchedule` with `retryDelaySeconds` and `retryDelayScheduleSeconds`."

- path: "src/app/execute-retry/index.ts"
  loc: "line 55"
  note: "The application layer resolves this schedule to a `delaySeconds` local variable."

- path: "src/adapters/delay.ts"
  loc: "line 1"
  note: "The infrastructure provides a `delay` primitive."

## Change Scope

- `src/domain/schedule.ts`
- `src/app/execute-retry/index.ts`

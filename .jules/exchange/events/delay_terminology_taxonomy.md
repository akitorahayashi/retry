---
label: "refacts"
created_at: "2024-05-23"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The concept of a fallback delay between attempts is referred to inconsistently across boundaries, mapped as `retryDelaySeconds` at the input boundary and as `defaultDelaySeconds` in the schedule domain.

## Goal

Ensure naming consistency between the configuration inputs and internal domain models. Either the input should be `defaultRetryDelaySeconds` or the schedule property should be `retryDelaySeconds`.

## Context

The `retry_delay_seconds` input represents the fallback or default delay when the `retry_delay_schedule_seconds` array runs out of predefined values (or is not provided). In `src/domain/schedule.ts`, this value is mapped to `defaultDelaySeconds`. This creates a conceptual disconnect where a single configuration value adopts two distinct names as it crosses from the `read-inputs` action boundary into the core `app/domain` boundaries. Following the principle of "Conventions Over Preference" and standard naming shape consistency, the internal name should reflect its origin or vice versa.

## Evidence

- path: "src/action/read-inputs.ts"
  loc: "10, 24-25"
  note: "Defines the property as `retryDelaySeconds` in the `RetryRequest` interface."
- path: "src/app/execute-retry.ts"
  loc: "44"
  note: "Maps `request.retryDelaySeconds` to the internal schedule's `defaultDelaySeconds`."
- path: "src/domain/schedule.ts"
  loc: "2, 13"
  note: "Names the property `defaultDelaySeconds` within the `RetrySchedule` interface."

## Change Scope

- `src/domain/schedule.ts`
- `src/app/execute-retry.ts`

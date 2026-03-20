---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "medium"
---

## Problem

The transport DTO `RetryRequest` is leaking into the application core logic, specifically being passed into the `runAttempt` execution function.

## Goal

Model a domain representation for the command to be executed (e.g., a `CommandExecution` domain object) so the core application layer does not depend on the transport-specific `RetryRequest`.

## Context

While `executeRetry` correctly maps retry policies and schedules to domain models (`RetryPolicy`, `RetrySchedule`), the command execution details (`command`, `shell`, `timeoutSeconds`, `terminationGraceSeconds`) remain trapped in the transport DTO `RetryRequest`. `runAttempt` then directly consumes this DTO, meaning the application execution core is tightly coupled to the action input layer representation.

## Evidence

- path: "src/app/execute-retry.ts"
  loc: "line 87"
  note: "`runAttempt` takes `RetryRequest` directly instead of a domain-specific model for the command execution."
- path: "src/action/read-inputs.ts"
  loc: "lines 5-16"
  note: "Defines `RetryRequest`, which mixes execution instructions with GitHub Action-specific configurations."

## Change Scope

- `src/app/execute-retry.ts`
- `src/action/read-inputs.ts`

---
label: "refacts"
created_at: "2024-05-23"
author_role: "taxonomy"
confidence: "high"
---

## Problem

A single concept—the current iteration number of the command execution—is inconsistently referred to as both `attempt` and `retryIndex`.

## Goal

Standardize on the term `attempt` for consistency across the core loop and utility functions, eliminating the redundant synonym.

## Context

In `src/app/execute-retry.ts`, the core loop iterant is clearly named `attempt` and passed cleanly to `runAttempt(..., attempt, ...)`. However, when fetching the delay for the next execution from `resolveRetryDelaySeconds`, this value is reassigned to `retryIndex`, creating an unnecessary synonym. This creates a conceptual collision where an attempt is treated structurally as an index, causing confusion because attempts are 1-based, whereas indices are typically 0-based. The schedule resolution logic in `src/domain/schedule.ts` adjusts for this by subtracting 1 from `retryIndex`, further indicating that `attempt` is the clearer, correct domain term.

## Evidence

- path: "src/app/execute-retry.ts"
  loc: "49, 79-80"
  note: "The variable `attempt` tracks iteration natively but is re-assigned to the alias `retryIndex` before passing to the schedule domain."
- path: "src/domain/schedule.ts"
  loc: "7-8, 10"
  note: "The domain method is named `resolveRetryDelaySeconds` and accepts a parameter `retryIndex`, but internally subtracts 1 since it's actually an attempt count, not a true array index."
- path: "src/domain/result.ts"
  loc: "4"
  note: "The concept is consistently named `attempt` inside `AttemptResult`, acting as the canonical term elsewhere."

## Change Scope

- `src/domain/schedule.ts`
- `src/app/execute-retry.ts`

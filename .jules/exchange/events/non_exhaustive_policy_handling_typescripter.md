---
label: "bugs"
created_at: "2024-05-24"
author_role: "typescripter"
confidence: "high"
---

## Problem

`shouldRetryFailure` uses sequential `if` statements over the `AttemptOutcome` discriminated union rather than an exhaustive `switch`, relying on a default fallback return (`return true`).

## Goal

Model state handling over `AttemptOutcome` using an exhaustive `switch` block so the compiler enforces handling for all possible missing or newly added outcome variants.

## Context

`AttemptOutcome` is a discriminated union of states. By checking individual cases and using a catch-all `return true;` fallback at the end, any new variants added to `AttemptOutcome` will silently fall through and become retryable by default, potentially violating policy.

## Evidence

- path: "src/domain/policy.ts"
  loc: "line 10-33"
  note: "Sequential if-statements evaluate policy logic without static exhaustiveness checking."

## Change Scope

- `src/domain/policy.ts`

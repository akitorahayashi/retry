---
label: "refacts"
created_at: "2026-03-25"
author_role: "data_arch"
confidence: "medium"
---

## Problem

`maxAttempts` is validated in both `readInputs` and `executeRetry`, blurring the boundary of where invariants are enforced and representing the same constraint in multiple places.

## Goal

Rely on `readInputs` to enforce parameter boundaries (transport/entrypoint layer) and possibly represent `maxAttempts` using a refined type, removing the redundant `if (!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0)` runtime panic in the core application logic.

## Context

According to First Principles, invariants should be enforced at the boundary. `readInputs` appropriately calls `readRequiredInteger('max_attempts', { minimum: 1 })`. The inner `executeRetry` should receive this explicitly trusted fact rather than validating it defensively again.

## Evidence

- path: "src/action/read-inputs.ts"
  loc: "readInputs (line 20)"
  note: "Validates `maxAttempts` with a minimum of 1."
- path: "src/app/execute-retry/index.ts"
  loc: "executeRetry (line 29)"
  note: "Defensively checks `!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0`."

## Change Scope

- `src/app/execute-retry/index.ts`

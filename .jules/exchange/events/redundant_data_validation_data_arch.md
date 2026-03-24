---
label: "refacts"
created_at: "2024-05-24"
author_role: "data_arch"
confidence: "high"
---

## Problem

`executeRetry` performs validation on `maxAttempts` parameter, despite it having been read and validated at the boundary (`readInputs`).

## Goal

Remove duplicated application validation logic for invariants that are properly validated at the transport/boundary entry point. Ensure data flows as "Represent Valid States Only".

## Context

When data flows into the application via the GitHub Action transport layer, `readInputs` calls `readRequiredInteger('max_attempts', { minimum: 1 })` which throws if it is not a positive integer. Despite this, `executeRetry` starts with `if (!Number.isInteger(params.maxAttempts) || params.maxAttempts <= 0) { throw new Error(...) }`. This duplicates validation across the transport and domain layers. Data should enter the system, be validated at the boundary, and from then on, assumed to be valid by encoding it in an appropriate type, or at least relying on the boundary contract.

## Evidence

- path: "src/action/read-inputs.ts"
  loc: "19"
  note: "`maxAttempts` is parsed and guaranteed to be an integer >= 1 at the boundary."
- path: "src/app/execute-retry/index.ts"
  loc: "32-36"
  note: "`executeRetry` repeats the invariant check for `maxAttempts <= 0`."

## Change Scope

- `src/app/execute-retry/index.ts`

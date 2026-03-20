---
label: "refacts"
implementation_ready: false
---

## Goal

Ensure the `RetryOn` concept is defined exactly once as a single source of truth used across the domain and transport boundaries.

## Problem

The `RetryOn` concept is defined multiple times as a string union type (`'any' | 'error' | 'timeout'`) without a single source of truth.

## Evidence

- source_event: "duplicate_retry_on_type_data_arch.md"
  path: "src/domain/policy.ts"
  loc: "line 2"
  note: "Defines `export type RetryOn = 'any' | 'error' | 'timeout'`."
- source_event: "duplicate_retry_on_type_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "line 3"
  note: "Duplicates the definition of `export type RetryOn = 'any' | 'error' | 'timeout'`."

## Change Scope

- `src/domain/policy.ts`
- `src/action/read-inputs.ts`

## Constraints

- Changes must only eliminate duplicate declarations without modifying business logic.
- Type definitions should reside in domain files (`src/domain/`) and be exported for use by transport files (`src/action/`).

## Acceptance Criteria

- `RetryOn` is defined strictly within `src/domain/policy.ts`.
- `read-inputs.ts` imports `RetryOn` from `src/domain/policy.ts`.
- The duplicate type declaration is removed.

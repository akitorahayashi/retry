---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

The boundary documentation explicitly declares "No silent fallback paths are used" as a failure invariant. However, `readBooleanFlag` in the implementation silently falls back to `false` when an empty string is provided, bypassing the validation step without any explicit warning or error.

## Goal

Align the implementation's boolean parsing logic with the documented architectural constraint against silent fallbacks, or modify the boundary documentation to explicitly document this intentional fallback.

## Context

According to `docs/architecture/boundary.md`, the action fails explicitly when "required inputs are missing" or "numeric inputs are invalid", and it asserts that "No silent fallback paths are used". Yet, if an empty string is supplied for the boolean flag `continue_on_error` (e.g., dynamically through an action expression that evaluates to an empty value), the `readBooleanFlag` silently treats it as `false`. This violates the strict failure invariants set in the documentation.

## Evidence

- path: "docs/architecture/boundary.md"
  loc: "line 45"
  note: "Explicitly states 'No silent fallback paths are used.' under Failure Invariants."

- path: "src/action/read-inputs.ts"
  loc: "line 92"
  note: "In `readBooleanFlag`, if the input is empty or missing (`!value`), it silently falls back to `return false` without failing validation or logging."

## Change Scope

- `docs/architecture/boundary.md`
- `src/action/read-inputs.ts`

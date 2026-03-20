---
label: "refacts"
created_at: "2024-05-23"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The exact same concept and data structure for the final execution outcome is represented by two distinct types: `FinalResult` in the domain and `RetryActionOutput` in the action boundary.

## Goal

Unify the data structure under a single canonical term (e.g., `FinalResult`) to enforce naming shape consistency across boundaries and avoid duplication.

## Context

The `FinalResult` interface defined in `src/domain/result.ts` represents the result of the entire execution process. When this result is passed to the action boundary to be emitted as GitHub Action outputs, the `emitOutputs` function in `src/action/emit-outputs.ts` redefines this exact shape as `RetryActionOutput`. The only difference is that `FinalResult` uses the `AttemptOutcome` type for `finalOutcome`, while `RetryActionOutput` hardcodes the string union `'success' | 'error' | 'timeout'`. This violates the principle of "One concept mapped to multiple terms" and introduces maintenance overhead if the outcome shape or possible values change.

## Evidence

- path: "src/domain/result.ts"
  loc: "10-15"
  note: "Defines the `FinalResult` interface representing the final execution state."
- path: "src/action/emit-outputs.ts"
  loc: "3-8"
  note: "Defines the structurally identical `RetryActionOutput` interface, duplicating the concept under a new name."
- path: "src/index.ts"
  loc: "8"
  note: "Passes the `result` (of type `FinalResult`) directly to `emitOutputs` (which expects `RetryActionOutput`), proving they represent the exact same concept."

## Change Scope

- `src/action/emit-outputs.ts`
- `src/domain/result.ts`

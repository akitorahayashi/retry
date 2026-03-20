---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "high"
---

## Problem

The result of the action execution is modeled twice: once as `FinalResult` in the domain logic, and once as `RetryActionOutput` in the action output logic. Furthermore, the `'success' | 'error' | 'timeout'` union type is hardcoded in `RetryActionOutput` rather than reusing the domain's `AttemptOutcome`.

## Goal

Eliminate `RetryActionOutput` and have `emitOutputs` consume `FinalResult` directly, or explicitly map the domain `FinalResult` to an output DTO without redeclaring structural types.

## Context

The `FinalResult` and `RetryActionOutput` interfaces define the exact same data structure. Due to TypeScript's structural typing, `FinalResult` is being implicitly passed to `emitOutputs(result: RetryActionOutput)` in `src/index.ts`. This is a transport DTO leaking into core domain logic (or vice versa) as an identical duplicate, violating Single Source of Truth and risking divergence.

## Evidence

- path: "src/domain/result.ts"
  loc: "lines 9-14"
  note: "Defines `FinalResult`."
- path: "src/action/emit-outputs.ts"
  loc: "lines 3-8"
  note: "Defines `RetryActionOutput` which structurally duplicates `FinalResult`, including a hardcoded inline union for `finalOutcome` instead of reusing `AttemptOutcome`."
- path: "src/index.ts"
  loc: "line 9"
  note: "Passes `result` of type `FinalResult` implicitly as `RetryActionOutput` to `emitOutputs`."

## Change Scope

- `src/domain/result.ts`
- `src/action/emit-outputs.ts`
- `src/index.ts`

---
label: "refacts"
created_at: "2024-03-24"
author_role: "typescripter"
confidence: "high"
---

## Problem

`AttemptResult` and `FinalResult` use flat interfaces that encode state with a string (`outcome`) alongside nullable properties (`exitCode: number | null`) and redundant flags (`succeeded: boolean`). This allows invalid state combinations to be represented, such as a `'success'` outcome with an `exitCode` of `null` and `succeeded: false`.

## Goal

Refactor `AttemptResult` and `FinalResult` into discriminated unions keyed by `outcome` (or `finalOutcome`), making invalid states unrepresentable. The redundant `succeeded` flag should be removed from the domain model and derived only when needed at the transport/action layer.

## Context

TypeScript's discriminated unions provide compiler-enforced state exhaustiveness and prevent unrepresentable states. Using flat interfaces with nullable fields and boolean flags forces consumers to guess if combinations like `outcome: 'success'` and `exitCode: null` are possible, violating the principle of making invalid states unrepresentable.

## Evidence

- path: "src/domain/result.ts"
  loc: "3-8"
  note: "`AttemptResult` encodes outcome as a string and allows `exitCode: number | null` across all outcomes, which means success can erroneously have a null exit code."
- path: "src/domain/result.ts"
  loc: "9-14"
  note: "`FinalResult` includes a redundant `succeeded` boolean alongside `finalOutcome`, allowing conflicting combinations."

## Change Scope

- `src/domain/result.ts`
- `src/app/execute-retry/index.ts`
- `src/action/emit-outputs.ts`

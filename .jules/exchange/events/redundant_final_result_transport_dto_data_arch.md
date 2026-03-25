---
label: "refacts"
created_at: "2026-03-25"
author_role: "data_arch"
confidence: "high"
---

## Problem

The domain layer contains a `FinalResult` type and a `toFinalResult` mapping function that are explicitly designed to match GitHub Action transport outputs, violating Boundary Sovereignty.

## Goal

Remove `FinalResult` from the domain layer. The domain should yield the core `AttemptResult` representing the execution outcome, and the action layer (`emitOutputs` and `index.ts`) should derive the action-specific output formats.

## Context

First Principles state that domain models should remain independent of transport or UI concerns. `FinalResult` renames fields to `finalExitCode` and `finalStdout`, and adds a derived `succeeded` boolean purely to satisfy `action.yml` outputs. This couples the core domain to GitHub Action specifics.

## Evidence

- path: "src/domain/result.ts"
  loc: "FinalResult"
  note: "Defines a type with 'final'-prefixed fields and a 'succeeded' boolean that mirror GitHub Action outputs."
- path: "src/domain/result.ts"
  loc: "toFinalResult"
  note: "Performs an inefficient transformation solely to rename fields and derive 'succeeded'."
- path: "src/action/emit-outputs.ts"
  loc: "emitOutputs"
  note: "Consumes the domain's FinalResult rather than receiving the domain model and performing the transport mapping itself."

## Change Scope

- `src/domain/result.ts`
- `src/action/emit-outputs.ts`
- `src/index.ts`
- `src/app/execute-retry/index.ts`

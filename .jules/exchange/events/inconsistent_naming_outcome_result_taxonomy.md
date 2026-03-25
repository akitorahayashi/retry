---
label: "refacts"
created_at: "2024-05-18"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The terms "outcome" and "result" are used ambiguously and occasionally interchangeably across the codebase, obscuring the boundary between an immediate physical completion state and a synthesized logical summary.

## Goal

Establish and enforce a canonical distinction: "Outcome" must refer strictly to the categorical classification of an execution attempt (e.g., success, error, timeout), while "Result" must refer to the structured envelope containing the outcome alongside associated data (e.g., attempt number, exit code, stdout).

## Context

In `src/domain/policy.ts`, `AttemptOutcome` is defined as `'success' | 'error' | 'timeout'`. However, `src/app/execute-retry/await-attempt-outcome.ts` defines an interface `AttemptExecutionOutcome` which is actually a structural result (containing `outcome`, `exitCode`, and `stdout`), blurring the line. Similarly, in `src/domain/result.ts`, `AttemptResult` contains an `outcome`, but `FinalResult` changes the property name to `finalOutcome`. This inconsistency causes cognitive friction and violates the "One Concept, One Preferred Term" principle.

## Evidence

- path: "src/domain/policy.ts"
  loc: "Line 1: export type AttemptOutcome = 'success' | 'error' | 'timeout'"
  note: "Defines 'Outcome' as a literal categorical state."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "Line 15: interface AttemptExecutionOutcome { outcome: AttemptOutcome; exitCode: number | null; stdout: string }"
  note: "Uses 'Outcome' in the interface name for a structure that is conceptually a 'Result' (it even contains an 'outcome' property)."
- path: "src/domain/result.ts"
  loc: "Line 25: finalOutcome: 'success'"
  note: "Prefixes 'Outcome' with 'final' inside 'FinalResult', making the property name shape inconsistent with 'AttemptResult' which just uses 'outcome'."

## Change Scope

- `src/domain/result.ts`
- `src/domain/policy.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/index.ts`
- `src/app/execute-retry/execute-attempt.ts`

---
label: "refacts"
created_at: "2024-05-18"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The terms `outcome` and `exitCode` are defined distinctly at the attempt level (`AttemptResult`), but are mapped to `finalOutcome` and `finalExitCode` in the `FinalResult` aggregate, and further as `final_outcome` and `final_exit_code` in the GitHub Action outputs. However, the action outputs are defined simply as `attempts` and `succeeded`, creating inconsistent prefixing.

## Goal

Align the naming of result properties between the single-attempt view, the final aggregate view, and the user-facing action outputs.

## Context

The `AttemptResult` domain model uses `outcome` and `exitCode`. The `FinalResult` uses `finalOutcome` and `finalExitCode`. However, the final result also includes `attempts` and `succeeded` which don't have the `final` prefix, despite representing the final state. This prefixing leaks into the user-facing outputs (`final_exit_code`, `final_outcome` vs `attempts`, `succeeded`), making the API inconsistent. If it's a "final" state, either all properties should indicate it, or none should, relying on the context (the output of the action) to imply finality.

## Evidence

- path: "src/domain/result.ts"
  loc: "lines 4-6"
  note: "`AttemptResult` properties: `attempt`, `outcome`, `exitCode`"
- path: "src/domain/result.ts"
  loc: "lines 9-13"
  note: "`FinalResult` properties: `attempts`, `finalExitCode`, `finalOutcome`, `succeeded`"
- path: "action.yml"
  loc: "lines 40-47"
  note: "Action outputs: `attempts`, `final_exit_code`, `final_outcome`, `succeeded`"
- path: "src/index.ts"
  loc: "line 14"
  note: "Log string uses mixed prefixing: `final_outcome`, `final_exit_code`"

## Change Scope

- `src/domain/result.ts`
- `src/action/emit-outputs.ts`
- `action.yml`
- `src/index.ts`
- `README.md`

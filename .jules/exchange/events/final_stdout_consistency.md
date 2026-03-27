---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

The documentation in `docs/architecture/boundary.md` outlines the runtime execution flow and states that the action emits final outputs: `attempts`, `outcome`, `exit code`, and `succeeded`. However, it omits `final_stdout` which is also emitted by the action, as documented in `action.yml`, `docs/configuration/inputs.md`, and implemented in `src/action/emit-outputs.ts`.

## Goal

Ensure `final_stdout` is included in the runtime execution flow documentation to provide a complete and accurate list of emitted outputs.

## Context

In `docs/architecture/boundary.md` under "Runtime Execution Flow", the last step is "Emit final outputs with attempts, outcome, exit code, and succeeded". It misses `final_stdout`. Since documentation must reflect the current state and act as a contract, omitting a critical output in the architectural boundary documentation creates a mismatch.

## Evidence

- path: "docs/architecture/boundary.md"
  loc: "line 20"
  note: "The step 'Emit final outputs with attempts, outcome, exit code, and succeeded.' is missing 'final_stdout'."

- path: "src/action/emit-outputs.ts"
  loc: "line 12"
  note: "`core.setOutput('final_stdout', result.stdout)` is emitted alongside the other outputs."

## Change Scope

- `docs/architecture/boundary.md`

---
label: "refacts"
implementation_ready: false
---

## Goal

Align the handling and string representation of a missing exit code across the domain, logging, and outputs.

## Problem

The internal code uses `exitCode` (`number | null`) for the command execution outcome, and `formatExitCode` to produce a display string (like `'none'`), but the action output is named `final_exit_code`, which emits an empty string `''` when no code is available instead of `'none'`.

When a command times out or is terminated, it does not have a numeric exit code. The domain represents this as `exitCode: null`. The app layer logging explicitly translates `null` to the literal string `'none'` via `formatExitCode`. The `emitOutputs` adapter translates `null` to an empty string `''` for the `final_exit_code` action output. The user-facing output shape does not match the internal logged shape for this missing value.

## Evidence

- source_event: "exit_code_format_taxonomy.md"
  path: "src/app/execute-retry/format-exit-code.ts"
  loc: "line 2"
  note: "Returns `'none'` when `exitCode === null` for application logging."

- source_event: "exit_code_format_taxonomy.md"
  path: "src/action/emit-outputs.ts"
  loc: "line 8"
  note: "Emits `''` (empty string) when `result.exitCode === null` for the GitHub Actions output."

- source_event: "exit_code_format_taxonomy.md"
  path: "docs/configuration/inputs.md"
  loc: "Outputs table"
  note: "Documents `final_exit_code` as 'empty when no code is available'."

## Change Scope

- `src/app/execute-retry/format-exit-code.ts`
- `src/action/emit-outputs.ts`
- `docs/configuration/inputs.md`

## Constraints

- Output formatting logic must be unified to a single definition to avoid diverging string representations of `null`.

## Acceptance Criteria

- The representation for a missing exit code (`null`) is consistent across logging and the action's `final_exit_code` output.
- Documentation accurately reflects the unified formatting string.

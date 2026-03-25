---
label: "bugs" # Must match a key in .jules/github-labels.json
created_at: "2026-03-25"
author_role: "typescripter"
confidence: "high"
---

## Problem

Empty `catch` blocks in standard error handling locations swallow failures silently. Certain fallback operations (such as stream reading and signal sending) omit explicit fallback logging, violating failure visibility principles and anti-patterns regarding swallowed exceptions.

## Goal

Ensure silent fallbacks are prohibited by logging, re-throwing, or returning explicitly from any caught error.

## Context

According to Design Conduct and Principles: "catch blocks that swallow errors or coerce them to any" are anti-patterns, and "Silent fallbacks are prohibited; any fallback is explicit, opt-in, and surfaced as a failure or a clearly logged, reviewed decision." In `runShellCommand.ts`, writing to standard output and error handles pipe failures with empty try-catch blocks. In `terminateProcessTree.ts`, signaling fallbacks silently swallow `process.kill` errors.

## Evidence

- path: "src/adapters/run-shell-command.ts"
  loc: "36-39"
  note: "An empty catch block swallows errors when stdout stream writes fail."

- path: "src/adapters/run-shell-command.ts"
  loc: "44-47"
  note: "An empty catch block swallows errors when stderr stream writes fail."

- path: "src/adapters/terminate-process-tree.ts"
  loc: "15-19"
  note: "An empty catch block swallows failures on `process.kill(-pid, signal)`, and another empty block follows for `process.kill(pid, signal)`."

## Change Scope

- `src/adapters/run-shell-command.ts`
- `src/adapters/terminate-process-tree.ts`

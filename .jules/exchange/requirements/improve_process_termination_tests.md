---
label: "tests"
implementation_ready: false
---

## Goal

Improve test determinism by eliminating arbitrary timeouts, and add test coverage to verify `terminateProcessTree` properly handles graceful fallback and `SIGKILL` escalations.

## Problem

`terminateProcessTree.test.ts` is flaky because it relies on timing and process lifecycle polling (`setTimeout`) without direct control, resolving after arbitrary intervals. Furthermore, edge cases and fallback logic for graceful process termination, including the forced `SIGKILL` escalation, remain entirely untested.

## Evidence

- source_event: "flaky_process_termination_tests_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 43"
  note: "`waitUntilStopped` relies on a loop of `setTimeout(resolve, 100)` to verify the process died."
- source_event: "flaky_process_termination_tests_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 22"
  note: "Arbitrary long timeout parameter of `10000` to prevent Vitest from aborting early due to slowness."
- source_event: "terminate_process_tree_uncovered_paths_cov.md"
  path: "src/adapters/terminate-process-tree.ts"
  loc: "10-11,20-26"
  note: "Fallback to direct pid signaling, and escalation to SIGKILL if `isAlive(pid)` is true are uncovered."
- source_event: "terminate_process_tree_uncovered_paths_cov.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "1-41"
  note: "Tests focus purely on the happy path where a process is terminated without triggering the SIGKILL escalation."

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`
- `src/adapters/terminate-process-tree.ts`

## Constraints

- Reliance on arbitrary timers and `setTimeout` loops for process state polling must be eliminated.
- Tests must hook into explicit events or promises (like `close` or `exit`).
- Coverage must include the negative process states, e.g., when the process refuses termination and forces `SIGKILL`.

## Acceptance Criteria

- `tests/adapters/terminate-process-tree.test.ts` does not use `waitUntilStopped` based on manual `setTimeout` intervals.
- The `terminateProcessTree` function has 100% path coverage for the SIGKILL escalation block.
- Flaky failures related to timing are resolved without disabling or skipping test cases.

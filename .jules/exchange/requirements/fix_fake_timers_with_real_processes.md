---
label: "tests"
implementation_ready: false
---

## Goal

Remove fake timers from tests involving real OS processes and use real timing or explicit process events (like `on('close')`) to ensure deterministic behavior.

## Problem

`tests/adapters/terminate-process-tree.test.ts` uses fake timers (`vi.useFakeTimers()`) to advance time (`vi.advanceTimersByTimeAsync()`) while asserting real OS-level child process termination.

## Context

Using fake timers to simulate timeouts while interacting with real external resources (like child processes) is non-deterministic. The process takes real time to respond to signals (`SIGTERM`, `SIGKILL`), but the fake timers advance immediately, potentially checking assertions before the OS has actually transitioned the process state. This leads to flaky tests and race conditions. Tests should either use real timeouts and await process exit events, or the process boundaries should be mocked entirely.

## Evidence

For multi-file events, add multiple list items.

- source_event: "fake_timers_with_real_os_processes_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 8"
  note: "Before each hook uses `vi.useFakeTimers()`"
- source_event: "fake_timers_with_real_os_processes_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 36"
  note: "Advances fake timers by 1000ms while waiting for a real process to terminate"
- source_event: "fake_timers_with_real_os_processes_qa.md"
  path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 72"
  note: "Advances fake timers by 2000ms after sending signal to a real process"

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

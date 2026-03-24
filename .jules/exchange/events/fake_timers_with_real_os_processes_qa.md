---
label: "tests"
created_at: "2024-03-24"
author_role: "qa"
confidence: "high"
---

## Problem

`tests/adapters/terminate-process-tree.test.ts` uses fake timers (`vi.useFakeTimers()`) to advance time (`vi.advanceTimersByTimeAsync()`) while asserting real OS-level child process termination.

## Goal

Remove fake timers from tests involving real OS processes and use real timing or explicit process events (like `on('close')`) to ensure deterministic behavior.

## Context

Using fake timers to simulate timeouts while interacting with real external resources (like child processes) is non-deterministic. The process takes real time to respond to signals (`SIGTERM`, `SIGKILL`), but the fake timers advance immediately, potentially checking assertions before the OS has actually transitioned the process state. This leads to flaky tests and race conditions. Tests should either use real timeouts and await process exit events, or the process boundaries should be mocked entirely.

## Evidence

For multi-file events, add multiple list items.

- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 8"
  note: "Before each hook uses `vi.useFakeTimers()`"
- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 36"
  note: "Advances fake timers by 1000ms while waiting for a real process to terminate"
- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 72"
  note: "Advances fake timers by 2000ms after sending signal to a real process"

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`

---
label: "tests"
implementation_ready: false
---

## Goal

Decouple tests from core Node module internals by making the dependency injection explicit for testing boundaries, or ensure the global `child_process` mock isn't stateful and conflicting when tests alternate between real execution and simulated errors.

## Problem

`tests/adapters/run-shell-command.test.ts` has a fuzzy and problematic boundary design between asserting real child process logic and simulating mock failures, relying on globally mocking a core node module (`node:child_process`).

## Context

The test file `tests/adapters/run-shell-command.test.ts` uses `vi.mock('node:child_process', ...)` to globally wrap `spawn`. Some tests use the original `spawn` implementation to run actual shell scripts (like `tests/fixtures/commands/emit-stdout-and-stderr.sh`), effectively using real `child_process` capabilities. Other tests override `vi.mocked(spawn)` to simulate errors (`it('throws an error if the process fails to start and has no pid')`). Because `spawn` is a core Node module, mocking it globally while also using it to spawn real processes in the same file creates a brittle, confusing test boundary. The tests assert behaviors against the internal `spawn` contract rather than purely testing externally visible behavior or explicitly injecting an interface that could be stubbed cleanly. This increases maintenance cost and can lead to unexpected failures if `vitest` or other parallel tests happen to use `child_process`.

## Evidence

For multi-file events, add multiple list items.

- source_event: "mocked_core_modules_boundary_qa.md"
  path: "tests/adapters/run-shell-command.test.ts"
  loc: "line 7-13"
  note: "Globally mocks the core module `node:child_process` and replaces `spawn`."
- source_event: "mocked_core_modules_boundary_qa.md"
  path: "tests/adapters/run-shell-command.test.ts"
  loc: "line 26"
  note: "Test block 'returns zero exit code when command succeeds' runs real fixture, relying on `actual.spawn` inside the mock factory."
- source_event: "mocked_core_modules_boundary_qa.md"
  path: "tests/adapters/run-shell-command.test.ts"
  loc: "line 47"
  note: "Test block 'throws an error if the process fails to start and has no pid' overrides the mock to simulate failure."

## Change Scope

- `tests/adapters/run-shell-command.test.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

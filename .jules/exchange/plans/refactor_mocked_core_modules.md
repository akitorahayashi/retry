---
label: "tests"
---

## Goal

Decouple tests from core Node module internals by making the dependency injection explicit for testing boundaries, removing the stateful global mock of `node:child_process` which conflicts when tests alternate between real execution and simulated errors.

## Current State

`tests/adapters/run-shell-command.test.ts` has a fuzzy and problematic boundary design between asserting real child process logic and simulating mock failures, relying on globally mocking a core node module (`node:child_process`).
- `src/adapters/run-shell-command.ts`: Directly imports `spawn` from `node:child_process` and uses it internally. This creates a hard dependency that requires module-level mocking to test failure modes.
- `tests/adapters/run-shell-command.test.ts`: Uses `vi.mock('node:child_process', ...)` to globally wrap `spawn`. Some tests use the original `spawn` implementation to run actual shell scripts, effectively using real `child_process` capabilities. Other tests override `vi.mocked(spawn)` to simulate errors. Because `spawn` is a core Node module, mocking it globally while also using it to spawn real processes in the same file creates a brittle, confusing test boundary. The tests assert behaviors against the internal `spawn` contract rather than purely testing externally visible behavior or explicitly injecting an interface that could be stubbed cleanly.

## Plan

1. Use `replace_with_git_merge_diff` to modify `src/adapters/run-shell-command.ts`. Add an optional `spawnFn` parameter to `runShellCommand` that defaults to the imported `spawn` from `node:child_process`. Use `spawnFn` instead of `spawn` internally.
2. Use `replace_with_git_merge_diff` to modify `tests/adapters/run-shell-command.test.ts`. Remove the global `vi.mock('node:child_process', ...)` call and the `afterEach` hook restoring all mocks.
3. Use `replace_with_git_merge_diff` to modify the error simulation tests in `tests/adapters/run-shell-command.test.ts` to pass a mocked `spawn` function explicitly via the new `spawnFn` parameter to `runShellCommand`, rather than relying on `vi.mocked(spawn)`.
4. Use `run_in_bash_session` to run `npm run format:check` and `npm run lint` to ensure code style is maintained.
5. Use `run_in_bash_session` to execute `just test` to verify no regressions were introduced.

## Acceptance Criteria

- `runShellCommand` supports explicit dependency injection for the `spawn` function.
- `tests/adapters/run-shell-command.test.ts` no longer globally mocks `node:child_process`.
- Real execution tests run successfully using the default `spawn`.
- Simulated error tests successfully inject custom mock `spawn` implementations.
- Test coverage is maintained or improved.

## Risks

- Integrating explicit dependency injection changes the function signature. Call sites outside tests might need updates if not relying entirely on the default parameter.
- The injected mock `spawn` in tests might not faithfully replicate the real `ChildProcess` API (e.g., event emitter behavior, `pid` property), leading to false positives or false negatives in tests.

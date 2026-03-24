---
label: "refacts"
---

## Goal

Consolidate the vocabulary around pausing execution into a single, unified concept (`delay`) that optionally supports cancellation, removing the artificial distinction created by adapter implementation details between `sleep` and `delay`.

## Current State

The concept of pausing or waiting is currently split between two adapters: `delay` (cancellable) and `sleep` (simple promise). This forces the domain/application layer to know which implementation detail to call depending on whether cancellation is needed.

### Implementation Targets
- `src/adapters/sleep.ts`: Provides `sleep(milliseconds)` returning a simple promise. Redundant with `delay`.
- `src/adapters/delay.ts`: Provides `delay(milliseconds)` returning an object with `promise` and `cancel`.
- `src/app/execute-retry/execute-retry-dependencies.ts`: Defines both `delay` and `sleep` as dependencies.
- `src/app/execute-retry/index.ts`: Uses `dependencies.sleep` for the retry pause.
- `src/app/execute-retry/await-attempt-outcome.ts`: Uses `dependencies.delay` for command and termination timeouts.

### Tests
- `tests/app/execute-retry.test.ts`: Mocks both `sleep` and `delay` dependencies. These tests need updating to reflect the consolidated usage.

### Documentation
- `AGENTS.md` or `README.md` (if they document `sleep`): Any architectural references to separate `sleep` and `delay` concepts must be removed or updated, although no direct mention was found in initial discovery.

## Plan

1. Delete `src/adapters/sleep.ts`
   - Remove the `sleep` adapter completely to eliminate the redundancy.

2. Update `src/app/execute-retry/execute-retry-dependencies.ts`
   - Remove `sleep` from the `ExecuteRetryDependencies` interface and the `executeRetryDependencies` object.
   - Remove the `sleep` import.

3. Update `src/app/execute-retry/index.ts`
   - Change `await dependencies.sleep(...)` to use `await dependencies.delay(...).promise`.

4. Update Tests (`tests/app/execute-retry.test.ts`)
   - Remove `sleep` from all mocked dependency objects passed to `executeRetry`.
   - Update assertions that previously checked `sleepFn` to check the `delayFn` mock instead, ensuring the correct delay amounts are passed and the `.promise` property is awaited.
   - Example: Instead of `sleepFn = vi.fn().mockResolvedValue(...)`, use `delayFn = vi.fn().mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() })`.
   - Remove any references to `sleep`.

5. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

## Acceptance Criteria

- `src/adapters/sleep.ts` is deleted.
- Only the `delay` adapter exists and is used in the codebase.
- The `ExecuteRetryDependencies` interface no longer includes `sleep`.
- All tests pass, and behavior is preserved.
- The `consolidate_delay_adapters.md` requirement file is deleted.

## Risks

- Forgetting to await the `.promise` property of the `delay` result in `src/app/execute-retry/index.ts` could lead to unhandled promises or incorrect timing behavior.
- Incomplete test updates might leave mock references to `sleep`, causing test failures.
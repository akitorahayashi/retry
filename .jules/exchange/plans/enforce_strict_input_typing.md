---
label: "refacts"
---

## Goal

Create a strict boundary between transport logic and domain execution by explicitly converting inputs into nested domain models (`CommandExecution`, `RetryPolicy`, `RetrySchedule`), making `executeRetry` accept domain models rather than flat parameters, thus removing structural typing overlap.

## Current State

The boundary between transport and domain is porous because transport data structures bleed into domain execution, leading to structural typing overlap.
- `src/app/execute-retry/index.ts`: `executeRetry` accepts `ExecuteRetryParams`, a flat object mirroring the transport DTO `RetryRequest`. It manually reassembles `RetryPolicy` and `RetrySchedule` from this flat object. It then passes the whole flat object to `executeAttempt`, which implicitly satisfies the `CommandExecution` interface via structural typing.
- `src/index.ts`: The main entrypoint calls `readInputs()` and passes the resulting flat `RetryRequest` directly to `executeRetry`.
- `tests/app/execute-retry.test.ts`: The test setup uses a `createRequest` helper that returns a flat object mirroring `RetryRequest`, which is passed directly to `executeRetry`.

## Plan

### 1. Update executeRetry interface
- In `src/app/execute-retry/index.ts`, delete `ExecuteRetryParams`.
- Update the `executeRetry` signature to accept a structured request object containing `CommandExecution`, `RetryPolicy`, `RetrySchedule`, and `maxAttempts`:
  ```typescript
  export interface ExecuteRetryRequest {
    command: CommandExecution
    policy: RetryPolicy
    schedule: RetrySchedule
    maxAttempts: number
  }
  ```
- Update `executeRetry` to use the provided domain models instead of manually assembling them.
- Update `executeRetry` to pass `request.command` explicitly to `executeAttempt` instead of the flat params object.

### 2. Update Transport Boundary (src/index.ts)
- Update `src/index.ts` to map the flat `RetryRequest` from `readInputs()` into the new `ExecuteRetryRequest` structure, explicitly creating `CommandExecution`, `RetryPolicy`, and `RetrySchedule` objects before calling `executeRetry`.

### 3. Update Tests (tests/app/execute-retry.test.ts)
- Update the `createRequest` fixture to return the new nested `ExecuteRetryRequest` structure.
- Update all `executeRetry` calls within the tests to accommodate the updated interface.

## Acceptance Criteria

- `ExecuteRetryParams` is completely removed from the codebase.
- `executeRetry` signature accepts domain models and `maxAttempts`.
- The application logic does not assemble `RetryPolicy` and `RetrySchedule` inside `executeRetry`.
- `executeAttempt` receives an explicit `CommandExecution` object, not an implicitly typed flat object.
- Tests pass and maintain external behavior.

## Risks

- Overlooking test updates due to the large number of mocked calls.
- Missing edge cases where structural typing implicitly covered missing fields in tests.

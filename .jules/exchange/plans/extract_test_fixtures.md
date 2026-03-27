---
label: "refacts"
---

## Goal

Extract shared test setup logic, mock factories, and type definitions into domain-specific reusable test fixtures (e.g., `execute-retry-fixtures.ts` and `process-fixtures.ts`) to improve test maintainability and reduce boilerplate without using ambiguous filenames like "helpers".

## Current State

Excessive test setup duplication and lack of shared fixtures across application core tests.

- `tests/app/execute-retry.test.ts`: Contains `createRequest` and `completed` helper functions which duplicate logic for constructing command requests and mocked running commands.
- `tests/app/await-attempt-outcome.test.ts`: Repeatedly constructs `CommandSpec`, `RunningCommand`, and dependencies in individual test cases.
- `tests/app/execute-attempt.test.ts`: Constructs `CommandSpec` and `dependencies` independently.
- `tests/app/terminate-command-on-signal.test.ts`: Contains `createProcessSpies` and `findSignalHandler` which could be generalized.

This duplication increases the cost of modifying interfaces and obscures actual test logic with setup details. Extracting these into domain-specific shared fixture functions will make the tests more concise, robust, and easier to understand.

## Plan

1. Create `tests/fixtures/execute-retry-fixtures.ts` to export test setup factories like `createExecuteRetryRequest`, `createCompletedCommand`, `createNeverDelay`, and `createCommandSpec`.
2. Create `tests/fixtures/process-fixtures.ts` to export process mocking utilities like `createProcessSpies` and `findSignalHandler`.
3. Refactor `tests/app/execute-retry.test.ts` to replace local setup functions with the new shared fixtures.
4. Refactor `tests/app/await-attempt-outcome.test.ts` to replace repeated `CommandSpec` and `RunningCommand` initialization with fixture factories.
5. Refactor `tests/app/execute-attempt.test.ts` to replace inline `CommandSpec` setups with fixture factories.
6. Refactor `tests/app/terminate-command-on-signal.test.ts` to use `createProcessSpies` and `findSignalHandler` from `process-fixtures.ts`.

## Acceptance Criteria

- Common test setup and mocks are extracted into domain-specific test fixtures (e.g., `execute-retry-fixtures.ts`, `process-fixtures.ts`).
- Filenames and modules strictly avoid ambiguous terms like "helpers" or "utils".
- Redundant setup logic in individual app tests is replaced by using the shared test fixtures.
- All existing tests continue to pass without changes to application behavior.

## Risks

- Abstracting test setups into common fixtures might obscure test intent or over-couple different test suites.
- Refactoring `process.once` and `process.off` spies might inadvertently mask genuine test failures if the extraction logic has subtle differences from the current specific implementations.

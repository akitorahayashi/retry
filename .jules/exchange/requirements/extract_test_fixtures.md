---
label: "refacts"
implementation_ready: false
---

## Goal

Extract shared test setup logic, mock factories, and type definitions into reusable test helpers within `tests/fixtures` or a similar dedicated directory to improve test maintainability and reduce boilerplate.

## Problem

Excessive test setup duplication and lack of shared fixtures across application core tests. The test files `tests/app/execute-retry.test.ts`, `tests/app/await-attempt-outcome.test.ts`, and `tests/app/execute-attempt.test.ts` contain redundant setup code for creating mock objects and test configurations.

This duplication increases the cost of modifying interfaces and obscures actual test logic with setup details. Extracting these into shared helper functions will make the tests more concise, robust, and easier to understand.

## Evidence

- source_event: "duplicate_test_setup_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "14-58"
  note: "Contains `createRequest` and `completed` helper functions which duplicate logic for constructing command requests and mocked running commands."

- source_event: "duplicate_test_setup_qa.md"
  path: "tests/app/await-attempt-outcome.test.ts"
  loc: "41-247"
  note: "Repeatedly constructs `CommandSpec`, `RunningCommand`, and dependencies in individual test cases."

- source_event: "duplicate_test_setup_qa.md"
  path: "tests/app/terminate-command-on-signal.test.ts"
  loc: "5-27"
  note: "Contains `createProcessSpies` and `findSignalHandler` which could be generalized."

- source_event: "duplicate_test_setup_qa.md"
  path: "tests/app/execute-attempt.test.ts"
  loc: "23-38"
  note: "Constructs `CommandSpec` and `dependencies` independently."

## Change Scope

- `tests/app/execute-retry.test.ts`
- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/terminate-command-on-signal.test.ts`
- `tests/app/execute-attempt.test.ts`
- `tests/fixtures/helpers.ts` (New file)

## Constraints

- New test helpers should be strongly typed and support flexible mock overrides.

## Acceptance Criteria

- Common test setup and mocks are extracted into `tests/fixtures/helpers.ts`.
- Redundant setup logic in individual app tests is replaced by using shared test helpers.

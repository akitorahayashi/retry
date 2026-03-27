---
label: "refacts"
created_at: "2024-03-27"
author_role: "qa"
confidence: "high"
---

## Problem

Excessive test setup duplication and lack of shared fixtures across application core tests.
The test files `tests/app/execute-retry.test.ts`, `tests/app/await-attempt-outcome.test.ts`, and `tests/app/execute-attempt.test.ts` contain redundant setup code for creating mock objects and test configurations.

## Goal

Extract shared test setup logic, mock factories, and type definitions into reusable test helpers within `tests/fixtures` or a similar dedicated directory to improve test maintainability and reduce boilerplate.

## Context

Each test file in the `tests/app` directory independently constructs mock objects for `RunningCommand`, `ExecuteRetryRequest`, and related dependencies. This duplication increases the cost of modifying these interfaces, as changes must be propagated across multiple test files. Furthermore, it obscures the actual test logic by cluttering the test files with setup details. Extracting these into shared helper functions will make the tests more concise, robust, and easier to understand.

## Evidence

- path: "tests/app/execute-retry.test.ts"
  loc: "14-58"
  note: "Contains `createRequest` and `completed` helper functions which duplicate logic for constructing command requests and mocked running commands."
- path: "tests/app/await-attempt-outcome.test.ts"
  loc: "41-247"
  note: "Repeatedly constructs `CommandSpec`, `RunningCommand`, and dependencies in individual test cases."
- path: "tests/app/terminate-command-on-signal.test.ts"
  loc: "5-27"
  note: "Contains `createProcessSpies` and `findSignalHandler` which could be generalized."
- path: "tests/app/execute-attempt.test.ts"
  loc: "23-38"
  note: "Constructs `CommandSpec` and `dependencies` independently."

## Change Scope

- `tests/app/execute-retry.test.ts`
- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/terminate-command-on-signal.test.ts`
- `tests/app/execute-attempt.test.ts`
- `tests/fixtures/helpers.ts` (New file)

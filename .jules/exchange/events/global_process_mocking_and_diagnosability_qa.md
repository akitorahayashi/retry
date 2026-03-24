---
label: "tests"
created_at: "2024-03-24"
author_role: "qa"
confidence: "high"
---

## Problem

`tests/app/execute-retry.test.ts` mutates global `process` methods (`process.exit`, `process.once`, `process.off`) in a specific test without restoring them afterward in an `afterEach` hook or within the test itself, causing diagnosability issues via shared global state leakage.

## Goal

Ensure all global environment mocks (like `process` methods) are properly isolated per test by restoring all mocks in `afterEach` or avoiding global mutation if possible.

## Context

Mutating globals inside a specific `it` block and failing to restore them can lead to other seemingly unrelated tests failing because they inadvertently run against a mocked version of `process.exit` or event handlers. This shared mutable state destroys failure diagnosability because if a test fails due to leaked state, the cause is an entirely different file or test, frustrating developers and obscuring the real failure point. The test suite is currently missing an `afterEach` block containing `vi.restoreAllMocks()` or specific un-mocking steps for process globals.

## Evidence

For multi-file events, add multiple list items.

- path: "tests/app/execute-retry.test.ts"
  loc: "line 84-89"
  note: "Mocks `process.once`, `process.off`, and `process.exit` without cleaning them up."
- path: "tests/app/execute-retry.test.ts"
  loc: "line 78"
  note: "Test block 'interrupts running command and terminates process tree on $signal' contains global mutations."
- path: "tests/app/execute-retry.test.ts"
  loc: "line 36"
  note: "The `describe('executeRetry')` block lacks an `afterEach(() => vi.restoreAllMocks())` hook."

## Change Scope

- `tests/app/execute-retry.test.ts`

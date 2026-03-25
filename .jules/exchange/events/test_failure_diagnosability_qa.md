---
label: "tests"
created_at: "2024-03-25"
author_role: "qa"
confidence: "high"
---

## Problem

The test file `tests/app/execute-retry.test.ts` uses massive setup mock functions that hide the details of each test.

## Goal

Provide clearer boundary and granular failure diagnostic when tests fail. Tests should use concise structures, allowing clear separation between arrange, act, and assert.

## Context

`executeRetry` is tested using an extremely elaborate helper `createRequest` and mock functions `createNeverDelay`. The tests for `executeRetry` span several assertions and tightly couple to the exact execution sequence of `delay` and `runCommand`. This large surface area for each test means if one fails, it takes more than a few minutes to localize the specific failure because the entire retry engine state machine is mocked in each test.

## Evidence

- path: "tests/app/execute-retry.test.ts"
  loc: "55-104"
  note: "Tests `executeRetry` by simulating timeouts through multiple mocking layers including `resolveCompletion` callbacks. The arrange phase is tangled."

- path: "tests/app/execute-retry.test.ts"
  loc: "106-166"
  note: "Checks signal interruption by tracking `processOnceSpy`, triggering it manually, and flushing tasks via `vi.waitFor`, mingling async engine mechanics with pure policy logic."

## Change Scope

- `tests/app/execute-retry.test.ts`

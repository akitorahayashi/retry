---
label: "tests"
created_at: "2024-03-27"
author_role: "qa"
confidence: "high"
---

## Problem

Some timing-related tests rely on actual time progression or external assumptions, potentially causing flakiness, although `vi.useFakeTimers()` is used in some places.

## Goal

Ensure all timing-dependent tests use mocked timers or clear deterministic state checks rather than relying on real-time execution limits. Replace ambiguous timing structures with deterministic promises.

## Context

While `tests/adapters/terminate-process-tree.test.ts` uses `vi.useFakeTimers()`, tests in `tests/app/await-attempt-outcome.test.ts` manipulate complex Promise structures (`initialTimeoutPromise`, `terminationDelayPromise`, `terminateProcessTreePromise`, `delayPromise`) to simulate timing and event progression. While deterministic in a sense, this complex orchestration makes failures hard to diagnose and the logic brittle to refactoring.

## Evidence

- path: "tests/app/await-attempt-outcome.test.ts"
  loc: "123-228"
  note: "Test `terminates process tree when timeout is reached` constructs an intricate web of promises (`initialTimeoutPromise`, `terminationDelayPromise`, `terminateProcessTreePromise`) to control event order. This tight coupling to the promise structure makes it brittle and hard to read."
- path: "tests/app/execute-retry.test.ts"
  loc: "61-105"
  note: "Test `returns timeout and terminates process tree when timeout wins` similarly relies on mock implementations resolving deferred promises (`completionPromise`, `runCommand`)."

## Change Scope

- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/execute-retry.test.ts`

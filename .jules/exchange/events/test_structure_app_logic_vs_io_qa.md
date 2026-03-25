---
label: "tests"
created_at: "2024-03-25"
author_role: "qa"
confidence: "high"
---

## Problem

Some tests mock I/O boundaries at an unhelpful abstraction level or test asynchronous execution by tightly coupling to `process` internals instead of providing clean control over time.

## Goal

Ensure that pure domain logic is tested without I/O and I/O integration tests have explicit timing and lifecycle boundaries without flakes or brittle process mocks.

## Context

The `awaitAttemptOutcome` function uses `Promise.race` for timeouts, and `tests/app/await-attempt-outcome.test.ts` injects a mocked delay function that directly resolves promises or blocks. While this avoids real time delays, the test logic gets somewhat tangled with the internal implementation of how delays work (the `cancel` and `promise` objects are tightly coupled to the test expectations).

In `terminate-command-on-signal.test.ts`, `process.once`, `process.off`, and `process.exit` are spy-mocked. The tests execute real asynchronous code and manually advance promises (`await new Promise(process.nextTick)`). This creates a risk of brittle non-determinism, as node's event loop behavior is subtly relied upon for test sequencing rather than a deterministic test clock or explicit boundary interface.

## Evidence

- path: "tests/app/await-attempt-outcome.test.ts"
  loc: "128-150"
  note: "Tightly couples tests to the exact number of delay calls and their timing order, returning `new Promise(() => {})` to simulate a timeout not firing, making the test hard to read and sensitive to refactors."

- path: "tests/app/terminate-command-on-signal.test.ts"
  loc: "59-106"
  note: "Uses `await new Promise(process.nextTick)` repeatedly to flush microtask queue because it depends on real JS event loop scheduling rather than a deterministic clock or fully synchronous pure domain boundary."

## Change Scope

- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/terminate-command-on-signal.test.ts`

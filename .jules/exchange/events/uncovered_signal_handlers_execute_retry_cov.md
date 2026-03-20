---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

Signal handlers (SIGINT, SIGTERM) and timeouts in `executeRetry` (`src/app/execute-retry.ts`) are completely uncovered by tests, representing a significant risk to process management and cancellation guarantees.

## Goal

Add tests to cover signal propagation and timeout behaviors to ensure processes are reliably terminated when requested or when they exceed their allowed time.

## Context

The `executeRetry` orchestrates commands and attempts to cleanly shut down the child process tree via signal handlers (SIGTERM, SIGINT) and timeouts. However, these critical paths are untested. If signal propagation fails or the timeout does not correctly terminate the child processes, it could lead to orphaned processes, resource leaks, or zombie build steps that hang CI runners indefinitely. The absence of assertions covering these paths masks a major liability.

## Evidence

- path: "src/app/execute-retry.ts"
  loc: "110-161"
  note: "Signal handlers (`onSigterm`, `onSigint`) and timeout termination logic are executed but there are no tests asserting they correctly clean up the process tree or result in the proper outcome."
- path: "tests/app/execute-retry.test.ts"
  loc: "1-105"
  note: "Tests focus purely on iteration logic, policy evaluation, and scheduling delays, relying on mocked process completion. There are no tests to simulate signal events or a command exceeding `timeoutSeconds`."

## Change Scope

- `src/app/execute-retry.ts`
- `tests/app/execute-retry.test.ts`

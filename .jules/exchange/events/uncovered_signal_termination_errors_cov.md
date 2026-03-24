---
label: "tests"
created_at: "2024-03-24"
author_role: "cov"
confidence: "high"
---

## Problem

Signal termination handlers (`SIGTERM` and `SIGINT`) have uncovered catch blocks in `terminate-command-on-signal.ts`. The error handling when terminating a process tree or when a handler throws an error is not tested, masking potential failure modes.

## Goal

Add tests to ensure that when signal termination fails, the error is correctly caught and logged, and the process still exits gracefully to avoid hanging indefinitely.

## Context

The `registerCommandTerminationOnSignal` function listens for `SIGTERM` and `SIGINT` to clean up child processes. If the `terminateProcessTree` dependency throws an error, the code has a catch block that logs the failure. Additionally, if the `onSignal` promise throws, another catch block logs the error before forcing process exit. These error paths are missing from the current test suite (lines 31, 40-42, 52-54), leaving these critical cleanup routines vulnerable to regressions that could lead to dangling processes or unhandled promise rejections.

## Evidence

- path: "src/app/execute-retry/terminate-command-on-signal.ts"
  loc: "Lines 31, 40-42, 52-54"
  note: "Catch blocks handling termination errors and signal handler rejections are untested. Vitest coverage reports 77.77% branch coverage."

## Change Scope

- `src/app/execute-retry/terminate-command-on-signal.ts`
- `tests/app/terminate-command-on-signal.test.ts`

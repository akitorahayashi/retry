---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

Edge cases and fallback logic in `terminateProcessTree` (`src/adapters/terminate-process-tree.ts`) are untested, leaving process management fallbacks and SIGKILL escalations unverified.

## Goal

Add tests to ensure `terminateProcessTree` handles gracefully terminating processes via process groups (and the fallback) and correctly escalates to `SIGKILL` when `graceSeconds` timeout is exceeded.

## Context

The `terminateProcessTree` function is responsible for stopping the shell commands that are spawned. It contains critical process group termination fallbacks when `process.kill(-pid, signal)` fails, as well as an escalation to send `SIGKILL` if the process remains alive after `graceSeconds`. Currently, only the happy path of a process responding to termination is tested, but the failure of the process group kill, and the forced `SIGKILL` path are unverified, creating a major risk of orphaned processes if the fallback mechanisms silently fail.

## Evidence

- path: "src/adapters/terminate-process-tree.ts"
  loc: "10-11,20-26"
  note: "Fallback to direct pid signaling, and escalation to SIGKILL if `isAlive(pid)` is true are uncovered."
- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "1-41"
  note: "Tests focus purely on the happy path where a process is terminated without triggering the SIGKILL escalation."

## Change Scope

- `src/adapters/terminate-process-tree.ts`
- `tests/adapters/terminate-process-tree.test.ts`

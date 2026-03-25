---
label: "tests"
created_at: "2024-03-25"
author_role: "qa"
confidence: "high"
---

## Problem

Some tests, such as `tests/adapters/terminate-process-tree.test.ts`, rely on arbitrary numeric timeouts and real child process spawned with `setInterval`/`sleep` commands for process isolation testing, making them non-deterministic and prone to flakes under load.

## Goal

Ensure that adapter tests testing side effects are deterministic, replacing sleep-based and arbitrary wait assumptions with deterministic IPC or mocked out streams.

## Context

The adapter test `terminate-process-tree.test.ts` literally sets up a real spawned process `timeout-forever.sh` and uses a fixed grace period (`GRACE_PERIOD_SECONDS = 0.05`) to test timeout cancellation. Using real time to test race conditions in `SIGTERM` and `SIGKILL` escalations on the process tree is a classic source of test flakiness. The execution time of these shell scripts and Node's event loop scheduling means under load, `0.05` seconds could elapse before the process is fully registered or before it handles the signal, leading to random test failures.

## Evidence

- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "16-36"
  note: "Uses real bash script spawning with an arbitrary time period of 0.05 seconds to simulate an infinite process and check termination."

- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "50-76"
  note: "Tests `SIGKILL` escalation by checking if `isAlive` correctly tracks process state across `sleep` statements in `ignore-term-then-exit.sh`, heavily relying on execution speed and real sleep intervals."

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`

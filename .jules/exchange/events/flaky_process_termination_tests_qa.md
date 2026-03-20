---
label: "tests" # Must match a key in .jules/github-labels.json
created_at: "2024-03-20"
author_role: "qa" # e.g. taxonomy
confidence: "high"
---

## Problem

The test `tests/adapters/terminate-process-tree.test.ts` is flaky because it relies on timing and process lifecycle without direct control, resolving after arbitrary timeouts.

## Goal

Improve test determinism by eliminating timing assumptions in `terminateProcessTree.test.ts` and controlling process execution states explicitly where possible, or decoupling process status polling from `setTimeout` to use standard wait loops.

## Context

The `terminateProcessTree.test.ts` creates a real process and checks process termination via a custom `waitUntilStopped` loop hardcoded with `setTimeout(resolve, 100)`. This causes intermittent failures on busy or slow systems and increases the total test suite time. The reliance on `setTimeout` for testing state transitions rather than utilizing the `close` or `exit` events from the spawned child limits reliability and diagnosability. Determinism Over Retries: avoid timing-dependent flakiness.

## Evidence

For multi-file events, add multiple list items.

- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 43"
  note: "`waitUntilStopped` relies on a loop of `setTimeout(resolve, 100)` to verify the process died."
- path: "tests/adapters/terminate-process-tree.test.ts"
  loc: "line 22"
  note: "Arbitrary long timeout parameter of `10000` to prevent Vitest from aborting early due to slowness."

## Change Scope

- `tests/adapters/terminate-process-tree.test.ts`

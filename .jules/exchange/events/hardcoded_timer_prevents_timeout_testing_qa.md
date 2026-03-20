---
label: "tests" # Must match a key in .jules/github-labels.json
created_at: "2024-03-20"
author_role: "qa" # e.g. taxonomy
confidence: "high"
---

## Problem

The timeout feature in `executeRetry` uses a hardcoded `setTimeout` instead of abstracting time logic. There are no tests verifying that `executeRetry` correctly aborts attempts that exceed `timeoutSeconds`.

## Goal

Decouple time from the `executeRetry` orchestrator so the timeout behavior can be validated deterministically in unit tests without real delays.

## Context

The `executeRetry` function handles timeouts by calling `setTimeout` directly. The runtime dependencies interface already injects `sleep`, but timer creation and cancellation remain tightly coupled to the environment. Without injected timers, tests validating the timeout feature would either be slow and flaky, or missing entirely—which is the current state. Recovery cost from timeout-related bugs is currently high due to this missing test coverage.

## Evidence

For multi-file events, add multiple list items.

- path: "src/app/execute-retry.ts"
  loc: "line 124"
  note: "Direct usage of `setTimeout` for the timeout timer prevents controlling time in tests."
- path: "tests/app/execute-retry.test.ts"
  loc: "entire file"
  note: "No tests validate the timeout behavior or signal handling."

## Change Scope

- `src/app/execute-retry.ts`
- `tests/app/execute-retry.test.ts`

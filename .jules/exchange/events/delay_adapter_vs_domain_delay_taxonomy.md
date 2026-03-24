---
label: "refacts"
created_at: "2024-05-18"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The concept of a pause or waiting period is fragmented between two distinct adapters, `delay` (which returns a cancellable promise) and `sleep` (which returns a simple promise). This creates an unclear boundary and requires the domain/application layer to know which specific implementation detail to call depending on if cancellation is needed.

## Goal

Consolidate the vocabulary around pausing execution into a single, unified concept (e.g., `sleep` or `delay`) that optionally supports cancellation, removing the artificial distinction created by adapter implementation details.

## Context

In `src/adapters/delay.ts` and `src/adapters/sleep.ts`, two separate files provide essentially the same domain concept: waiting for a specific duration. `execute-retry-dependencies.ts` maps both of these as distinct concepts into the application layer. This requires the consumer (`index.ts` and `await-attempt-outcome.ts`) to choose between them based solely on whether they need cancellation capabilities, violating the principle of abstracting implementation details.

## Evidence

- path: "src/adapters/delay.ts"
  loc: "line 1"
  note: "Defines `delay` as a function returning an object with `promise` and `cancel`."
- path: "src/adapters/sleep.ts"
  loc: "line 1"
  note: "Defines `sleep` as a function returning a simple `Promise<void>`."
- path: "src/app/execute-retry/execute-retry-dependencies.ts"
  loc: "lines 11-15"
  note: "Requires both `delay` and `sleep` as distinct dependencies for the application layer."
- path: "src/app/execute-retry/index.ts"
  loc: "line 82"
  note: "Uses `dependencies.sleep` for the retry pause."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "lines 39, 70"
  note: "Uses `dependencies.delay` for command and termination timeouts."

## Change Scope

- `src/adapters/delay.ts`
- `src/adapters/sleep.ts`
- `src/app/execute-retry/execute-retry-dependencies.ts`
- `src/app/execute-retry/index.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`

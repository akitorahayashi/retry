---
label: "refacts"
created_at: "2024-03-24"
author_role: "typescripter"
confidence: "high"
---

## Problem

The core application layer mixes failure semantics. `executeAttempt` wraps domain execution in a try-catch block that swallows unknown errors and coercing them to a safe generic outcome (`outcome: 'error', exitCode: null`). It also handles both standard returns and exceptions inconsistently.

## Goal

Ensure a consistent failure contract. `executeAttempt` should use typed Result objects (or specific error classes) to handle process initiation/execution errors distinctly from command exit statuses. Swallowing unknown exceptions into a generic failure outcome masks the true cause of failure and prevents proper escalation.

## Context

Catch blocks that swallow `unknown` errors and coerce them to `any` or generic default domains make debugging impossible and mask systemic failures (e.g. process spawn failure vs command error). The failure mode needs to be explicit, and true runtime exceptions shouldn't be flattened into standard failure paths.

## Evidence

- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "47-56"
  note: "try-catch block intercepts `error: unknown`, converts the message to string, logs it, and silently returns an `AttemptResult` with `outcome: 'error'`, masking whether the process failed to start or if something else failed."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "63-68"
  note: "Similar pattern swallowing `error: unknown` on termination attempts without escalating."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`

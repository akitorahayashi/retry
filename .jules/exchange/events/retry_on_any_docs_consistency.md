---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

`docs/usage.md` claims that the default standard workflow usage "retries non-zero command failures", implicitly omitting timeouts. However, the default behavior (`retry_on: 'any'`) actually retries both command errors (non-zero exits) and timeouts.

## Goal

Correct `docs/usage.md` to accurately reflect that the default behavior retries both non-zero command failures and timeouts.

## Context

When a user reads the "Standard Workflow Usage" section in `docs/usage.md`, they are told that the configuration retries non-zero command failures. This implies that timeouts are not retried, or that they are a separate class of failure not covered by the default configuration. However, `src/domain/policy.ts` shows that when `retry_on` is `'any'` (the default value defined in `action.yml`), both `error` and `timeout` outcomes are eligible for retry. This drift between the documentation and the implementation can mislead users about the action's failure coverage.

## Evidence

- path: "docs/usage.md"
  loc: "14"
  note: "States 'This configuration retries non-zero command failures up to three attempts.', omitting timeouts."

- path: "src/domain/policy.ts"
  loc: "16-35"
  note: "The `shouldRetryFailure` function shows that both 'timeout' and 'error' outcomes are retried when `policy.retryOn` is 'any' (the default)."

## Change Scope

- `docs/usage.md`

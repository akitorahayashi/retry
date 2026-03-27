---
label: "tests"
created_at: "2024-03-27"
author_role: "cov"
confidence: "high"
---

## Problem

The default case in `shouldRetryFailure` (handling the exhaustive check for `outcome`) inside `src/domain/policy.ts` lacks test coverage.

## Goal

Achieve full branch and statement coverage for the `shouldRetryFailure` function to ensure exhaustive matching is maintained correctly at compile and runtime.

## Context

While the TypeScript compiler ensures exhaustive checks via `never`, runtime coverage indicates lines 39-41 are missed. Since `outcome` could potentially receive an invalid value if incorrectly typed at the boundary (e.g. from action inputs parsing), ensuring its behavior is tested, or acknowledging the compile-time guard, completes the domain rules coverage for policies.

## Evidence

- path: "coverage/coverage-summary.json"
  loc: ""/app/src/domain/policy.ts""
  note: "Shows uncovered line #s 39-41."

- path: "src/domain/policy.ts"
  loc: "line 38-41"
  note: "The `default` case and its exhaustive check cast `const _exhaustiveCheck: never = outcome` are not covered."

## Change Scope

- `src/domain/policy.ts`
- `tests/domain/policy.test.ts`

---
label: "tests"
created_at: "2024-05-24"
author_role: "cov"
confidence: "high"
---

## Problem

Missing coverage for configuration input validation and edge cases, notably related to user-defined booleans and integer validation.

Specifically:
1. `src/action/read-inputs.ts` lines 78-79 and 108 are missing branch coverage. The error handling for parsing integers when an input isn't a valid integer and testing the 'off'/'no'/'0' boolean flag branch for `continueOnError` are uncovered.

## Goal

Add explicit unit tests to ensure that invalid user inputs (non-integers) fail fast and properly log the problem, and that valid explicit 'false' inputs for booleans operate as expected.

## Context

Configuration reading is the entry point for the Action. Uncovered error paths here can lead to confusing and hard-to-diagnose runtime problems for users configuring their CI pipelines. While basic coverage exists, specific error and branch behaviors (like non-integer handling and parsing specifically truthy/falsy fallback tokens) need to be formally asserted.

## Evidence

- path: "src/action/read-inputs.ts"
  loc: "78-79, 108"
  note: "Branch handling string regex match failure for parseInt wrapper, and explicit false-value normalization parsing are uncovered."

## Change Scope

- `src/action/read-inputs.ts`
- `tests/action/read-inputs.test.ts`

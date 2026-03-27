---
label: "refacts"
created_at: "2024-03-27"
author_role: "data_arch"
confidence: "high"
---

## Problem

Input validation relies entirely on implicit panics/unwraps (throwing raw `Error` objects) instead of modeling invalid states via explicit error types or Result monads.

## Goal

Model boundary validation explicitly to prevent hidden control flow and unstructured error reporting.

## Context

The module responsible for reading and validating GitHub Action inputs, `readInputs()`, relies exclusively on throwing unstructured `Error` objects when invariants fail (e.g. required field missing, incorrect format, invalid boolean tokens). This violates the principle of explicit error modeling. The data boundary entry point accepts inputs but falls back to hidden control flow instead of returning an explicit parsing result, moving the burden of capturing and formatting validation issues to higher-level wrappers implicitly.

## Evidence

- path: "src/action/read-inputs.ts"
  loc: "42"
  note: "`readRequiredString` throws raw `Error` when missing."
- path: "src/action/read-inputs.ts"
  loc: "78"
  note: "`parseInteger` throws `Error` on failed number regex."
- path: "src/action/read-inputs.ts"
  loc: "131"
  note: "`readRetryOn` throws `Error` on invalid union values."

## Change Scope

- `src/action/read-inputs.ts`
- `src/index.ts`

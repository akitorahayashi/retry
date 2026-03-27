---
label: "refacts"
implementation_ready: false
---

## Goal

Model boundary validation explicitly to prevent hidden control flow and unstructured error reporting.

## Problem

Input validation relies entirely on implicit panics/unwraps (throwing raw `Error` objects) instead of modeling invalid states via explicit error types or Result monads. The module responsible for reading and validating GitHub Action inputs, `readInputs()`, relies exclusively on throwing unstructured `Error` objects when invariants fail (e.g. required field missing, incorrect format, invalid boolean tokens).

This violates the principle of explicit error modeling. The data boundary entry point accepts inputs but falls back to hidden control flow instead of returning an explicit parsing result, moving the burden of capturing and formatting validation issues to higher-level wrappers implicitly.

## Evidence

- source_event: "implicit_input_validation_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "42"
  note: "`readRequiredString` throws raw `Error` when missing."

- source_event: "implicit_input_validation_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "78"
  note: "`parseInteger` throws `Error` on failed number regex."

- source_event: "implicit_input_validation_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "131"
  note: "`readRetryOn` throws `Error` on invalid union values."

## Change Scope

- `src/action/read-inputs.ts`
- `src/index.ts`

## Constraints

- Error structures must capture enough context for clear GitHub Action failure messages.

## Acceptance Criteria

- Input parsing returns a Result-like type containing either the successfully parsed config or explicit validation errors.
- Raw `throw Error()` usage for control flow is eliminated in `read-inputs.ts`.

---
label: "refacts"
---

## Goal

Model boundary validation explicitly to prevent hidden control flow and unstructured error reporting.

## Current State

Input validation relies entirely on implicit panics/unwraps (throwing raw `Error` objects) instead of modeling invalid states via explicit error types or Result monads.
- `src/action/read-inputs.ts`: Relies exclusively on throwing unstructured `Error` objects when invariants fail (e.g. required field missing, incorrect format, invalid boolean tokens). This violates the principle of explicit error modeling and creates hidden control flow.
- `src/index.ts`: Assumes `readInputs()` will throw on invalid input, delegating validation failure reporting to a global error handler implicitly rather than handling an explicit validation result.
- `tests/action/read-inputs.test.ts`: Asserts that `readInputs()` throws exceptions for invalid inputs, coupling test verification to internal error-throwing mechanisms rather than evaluating an observable result boundary.

## Plan

1. Define a `ParseResult<T>` discriminated union type (e.g., `{ ok: true, value: T } | { ok: false, errors: string[] }`) to model validation success and failure outcomes.
2. Refactor `src/action/read-inputs.ts` to use `ParseResult`. Update `readInputs` and internal parsing helpers (`readRequiredString`, `parseInteger`, `readRetryOn`, etc.) to return validation errors explicitly. Eliminate all `throw new Error()` usages for control flow.
3. Update the entry point in `src/index.ts` to handle the result of `readInputs()`. If parsing fails, output the explicit validation errors using `core.setFailed()` instead of relying on the unhandled exception fallback.
4. Refactor `tests/action/read-inputs.test.ts` to assert against the properties of the explicit result object instead of using `expect().toThrow()`. Ensure tests verify that appropriate validation errors are returned in the failure payload.

## Acceptance Criteria

- Input parsing returns a Result-like type containing either the successfully parsed config or explicit validation errors.
- Raw `throw Error()` usage for control flow is eliminated in `read-inputs.ts`.
- Tests assert externally observable behavior at the owning boundary by verifying the explicit validation result.

## Risks

- Aggregating multiple validation errors alters the structure of internal parsing helpers, which may complicate the control flow if not managed correctly.
- Missing an implicit throw in a nested helper could cause unhandled exceptions that bypass the new explicit boundary.

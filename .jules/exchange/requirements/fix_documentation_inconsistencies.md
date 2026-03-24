---
label: "docs"
implementation_ready: false
---

## Goal

Update the documentation in `docs/architecture/boundary.md` to include `succeeded` output, so it conforms to the implementation in `src/action/emit-outputs.ts` and `src/domain/result.ts`. Update `README.md` to include the defaults for `shell` (bash), `retry_delay_seconds` (0), and `termination_grace_seconds` (5) to match the implementation in `action.yml`. Ensure input formatting in examples is consistent. While YAML accepts both, mixing unquoted strings like `1,2,5,10` and quoted strings for numeric strings like `'5'` within the same code block is a documentation anti-pattern in terms of formatting and style rules, given GitHub Actions inputs are fundamentally strings.

## Problem

The execution sequence documented in `docs/architecture/boundary.md` is incomplete and contradicts the implemented behavior. It claims that `emit outputs with attempts, outcome, and exit code`, completely omitting `succeeded` which is emitted by the code. The Action Contract section in `README.md` documents inputs with their optionality and some defaults, but omits the default values for `shell`, `retry_delay_seconds`, and `termination_grace_seconds` which are defined in `action.yml` and `docs/configuration/inputs.md`. The documentation in `docs/usage.md` shows an example with unquoted numeric list input for `retry_delay_schedule_seconds: 1,2,5,10` while other numeric inputs in the same example like `max_attempts`, `timeout_seconds`, and `termination_grace_seconds` are quoted.

## Context

The architecture boundary documentation lists the runtime execution flow. Step 5 says: `Emit final outputs with attempts, outcome, and exit code.` This leaves out the `succeeded` output. Users reading the `README.md` might assume there are no defaults for these optional inputs, leading to misunderstanding the action's fallback behavior. The documentation is inconsistent because `retry_on` and `continue_on_error` explicitly mention their defaults. GitHub Actions inputs are passed as strings. Using quotes for numeric values explicitly communicates this type behavior, which is standard practice in GitHub Actions documentation to avoid YAML type coercion surprises (e.g. `on`, `yes`, octal values). The example `Timeout-Only Retry Example` mixes these conventions.

## Evidence

- source_event: "omitted_succeeded_output_consistency.md"
  path: "docs/architecture/boundary.md"
  loc: "44"
  note: "Documentation mentions `Emit final outputs with attempts, outcome, and exit code.` missing the `succeeded` flag."
- source_event: "omitted_succeeded_output_consistency.md"
  path: "src/action/emit-outputs.ts"
  loc: "14-17"
  note: "Implementation emits `attempts`, `final_exit_code`, `final_outcome`, and `succeeded`."
- source_event: "missing_defaults_in_readme_consistency.md"
  path: "README.md"
  loc: "27-36"
  note: "Inputs `shell`, `retry_delay_seconds`, and `termination_grace_seconds` are listed as `(optional)` but their default values are missing."
- source_event: "missing_defaults_in_readme_consistency.md"
  path: "action.yml"
  loc: "12, 20, 36"
  note: "`shell` has default `bash`, `retry_delay_seconds` has default `'0'`, and `termination_grace_seconds` has default `'5'`."
- source_event: "mixed_quotes_in_yaml_examples_consistency.md"
  path: "docs/usage.md"
  loc: "43"
  note: "`retry_delay_schedule_seconds: 1,2,5,10` uses an unquoted string, while lines 40, 41, and 44 use quoted strings like `'5'`."

## Change Scope

- `README.md`
- `docs/architecture/boundary.md`
- `docs/usage.md`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

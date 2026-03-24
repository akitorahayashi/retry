---
label: "tests"
implementation_ready: true
---

## Goal

Refactor the metadata test into smaller, single-concern assertions to improve failure localization (diagnosability).

## Problem

The test `tests/action/action-metadata.test.ts` has low diagnosability due to combining all metadata validation into one assertion block, leading to ambiguous failures.

## Context

The `action-metadata.test.ts` reads the `action.yml` file and tests node execution, main file, required inputs, and outputs all within one `it` block. If the test fails, a developer must hunt down the exact line that failed without clear semantic groupings or focused boundary design. Recovery cost optimization demands breaking down these properties into discrete assertions.

## Evidence

For multi-file events, add multiple list items.

- source_event: "monolithic_action_metadata_test_qa.md"
  path: "tests/action/action-metadata.test.ts"
  loc: "line 19"
  note: "Single test case validating inputs, outputs, and runner configuration simultaneously."

## Change Scope

- `tests/action/action-metadata.test.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

---
label: "tests" # Must match a key in .jules/github-labels.json
created_at: "2024-03-20"
author_role: "qa" # e.g. taxonomy
confidence: "high"
---

## Problem

The test `tests/action/action-metadata.test.ts` has low diagnosability due to combining all metadata validation into one assertion block, leading to ambiguous failures.

## Goal

Refactor the metadata test into smaller, single-concern assertions to improve failure localization (diagnosability).

## Context

The `action-metadata.test.ts` reads the `action.yml` file and tests node execution, main file, required inputs, and outputs all within one `it` block. If the test fails, a developer must hunt down the exact line that failed without clear semantic groupings or focused boundary design. Recovery cost optimization demands breaking down these properties into discrete assertions.

## Evidence

For multi-file events, add multiple list items.

- path: "tests/action/action-metadata.test.ts"
  loc: "line 19"
  note: "Single test case validating inputs, outputs, and runner configuration simultaneously."

## Change Scope

- `tests/action/action-metadata.test.ts`

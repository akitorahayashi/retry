---
label: "tests"
created_at: "2024-03-24"
author_role: "cov"
confidence: "high"
---

## Problem

`sanitizeCommand` has low branch and statement coverage, specifically regarding its handling of edge cases for empty or whitespace-only commands.

## Goal

Implement tests for `sanitizeCommand` to verify that it gracefully handles empty strings, commands containing only spaces, and multi-argument commands, achieving complete branch coverage.

## Context

The `sanitizeCommand` function parses shell commands to extract the base executable name for logging. The coverage report indicates line coverage at 69.23% and branch coverage at just 25% (lines 4-5 and 12-13 are uncovered). Specifically, the branch `if (parts.length === 0 || !parts[0])` returning `"<empty>"` and the branch `if (argsCount === 0)` are currently untested. These gaps reduce confidence in the logging utility's safety against unexpected inputs.

## Evidence

- path: "src/app/execute-retry/sanitize-command.ts"
  loc: "Lines 4-5, 12-13"
  note: "Branches handling zero-length or no-argument commands are not tested. Branch coverage is 25%."

## Change Scope

- `src/app/execute-retry/sanitize-command.ts`
- `tests/app/sanitize-command.test.ts`

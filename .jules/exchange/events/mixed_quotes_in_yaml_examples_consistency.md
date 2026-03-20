---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

The documentation in `docs/usage.md` shows an example with unquoted numeric list input for `retry_delay_schedule_seconds: 1,2,5,10` while other numeric inputs in the same example like `max_attempts`, `timeout_seconds`, and `termination_grace_seconds` are quoted.

## Goal

Ensure input formatting in examples is consistent. While YAML accepts both, mixing unquoted strings like `1,2,5,10` and quoted strings for numeric strings like `'5'` within the same code block is a documentation anti-pattern in terms of formatting and style rules, given GitHub Actions inputs are fundamentally strings.

## Context

GitHub Actions inputs are passed as strings. Using quotes for numeric values explicitly communicates this type behavior, which is standard practice in GitHub Actions documentation to avoid YAML type coercion surprises (e.g. `on`, `yes`, octal values). The example `Timeout-Only Retry Example` mixes these conventions.

## Evidence

- path: "docs/usage.md"
  loc: "43"
  note: "`retry_delay_schedule_seconds: 1,2,5,10` uses an unquoted string, while lines 40, 41, and 44 use quoted strings like `'5'`."

## Change Scope

- `docs/usage.md`
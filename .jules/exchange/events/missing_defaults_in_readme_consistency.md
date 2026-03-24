---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

The Action Contract section in `README.md` documents inputs with their optionality and some defaults, but omits the default values for `shell`, `retry_delay_seconds`, and `termination_grace_seconds` which are defined in `action.yml` and `docs/configuration/inputs.md`.

## Goal

Update `README.md` to include the defaults for `shell` (bash), `retry_delay_seconds` (0), and `termination_grace_seconds` (5) to match the implementation in `action.yml`.

## Context

Users reading the `README.md` might assume there are no defaults for these optional inputs, leading to misunderstanding the action's fallback behavior. The documentation is inconsistent because `retry_on` and `continue_on_error` explicitly mention their defaults.

## Evidence

- path: "README.md"
  loc: "27-36"
  note: "Inputs `shell`, `retry_delay_seconds`, and `termination_grace_seconds` are listed as `(optional)` but their default values are missing."
- path: "action.yml"
  loc: "12, 20, 36"
  note: "`shell` has default `bash`, `retry_delay_seconds` has default `'0'`, and `termination_grace_seconds` has default `'5'`."

## Change Scope

- `README.md`

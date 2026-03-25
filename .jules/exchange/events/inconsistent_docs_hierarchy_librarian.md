---
label: "docs"
created_at: "2026-03-25"
author_role: "librarian"
confidence: "high"
---

## Problem

Inconsistent structural hierarchy within the `docs/` directory; `usage.md` is placed as a flat file at the top level while other topic groupings (`architecture/`, `configuration/`) use directories.

## Goal

Relocate `usage.md` into an appropriate subdirectory (e.g., `docs/guides/usage.md` or `docs/procedures/usage.md`) to establish a stable structural foundation for topic groupings and eliminate flat accumulation.

## Context

Structural cohesion requires stable naming rules. Placing specialized documents at the top level of `docs/` alongside directories creates a mixed structural hierarchy that increases navigation entropy. Grouping usage examples under a specific capability-based subdirectory ensures that structural choices are deterministic and reduces lookup branching as the documentation scales.

## Evidence

- path: "docs/usage.md"
  loc: "entire file"
  note: "A flat file located at the top of docs/ while other topics use directories, hiding structural grouping intent."
- path: "docs/architecture/"
  loc: "directory"
  note: "Uses a subdirectory for structural cohesion, contrasting with the flat usage.md."
- path: "docs/configuration/"
  loc: "directory"
  note: "Uses a subdirectory for structural cohesion, contrasting with the flat usage.md."

## Change Scope

- `docs/usage.md`
- `docs/README.md`
- `README.md`

---
label: "docs"
implementation_ready: false
---

## Goal

Separate the content of `CONTRIBUTING.md` into distinct canonical paths based on structural responsibility (procedures, architecture, and policy) to enforce document responsibility separation and reduce lookup branching.

## Problem

`CONTRIBUTING.md` mixes distinct structural responsibilities, including procedural guides (Local Verification), structural specifications (Distribution Boundary), and policy definitions (Release Model), creating a flat accumulation that prevents users from choosing the right subtree from intent alone.

## Evidence

- source_event: "mixed_responsibilities_contributing_librarian.md"
  path: "CONTRIBUTING.md"
  loc: "lines 7-23"
  note: "Contains 'Local Verification' procedural steps, which is distinct from architectural specifications."

- source_event: "mixed_responsibilities_contributing_librarian.md"
  path: "CONTRIBUTING.md"
  loc: "lines 25-27"
  note: "Contains 'Distribution Boundary' details, which acts as structural specification rather than contribution policy."

- source_event: "mixed_responsibilities_contributing_librarian.md"
  path: "CONTRIBUTING.md"
  loc: "lines 29-32"
  note: "Contains 'Release Model', representing repository policy."

## Change Scope

- `CONTRIBUTING.md`
- `docs/architecture/boundary.md`
- `docs/policy/release.md`
- `docs/procedures/verification.md`

## Constraints

- One document must have one structural responsibility.
- Mixed procedure, specification, and policy in a single file hides placement intent and must be avoided.

## Acceptance Criteria

- The contents of `CONTRIBUTING.md` are divided and moved to `docs/architecture/boundary.md`, `docs/policy/release.md`, and `docs/procedures/verification.md` (or similar appropriate paths).
- `CONTRIBUTING.md` is removed or simplified to only index or refer to these specialized paths.

---
label: "docs"
created_at: "2026-03-25"
author_role: "librarian"
confidence: "high"
---

## Problem

`CONTRIBUTING.md` mixes distinct structural responsibilities, including procedural guides (Local Verification), structural specifications (Distribution Boundary), and policy definitions (Release Model).

## Goal

Separate the content of `CONTRIBUTING.md` into distinct canonical paths based on responsibility (e.g., procedures, architecture, and policy) to enforce document responsibility separation and reduce lookup branching.

## Context

One document must have one structural responsibility. Mixing procedure, specification, and policy in a single file hides placement intent and violates the principle that related documents should be structurally distinct. The "Distribution Boundary" conceptually belongs with architecture, while "Release Model" and "Local Verification" have distinct maintenance triggers and should reside in dedicated policy or procedure paths. This flat accumulation prevents users from choosing the right subtree from intent alone.

## Evidence

- path: "CONTRIBUTING.md"
  loc: "lines 7-23"
  note: "Contains 'Local Verification' procedural steps, which is distinct from architectural specifications."
- path: "CONTRIBUTING.md"
  loc: "lines 25-27"
  note: "Contains 'Distribution Boundary' details, which acts as structural specification rather than contribution policy."
- path: "CONTRIBUTING.md"
  loc: "lines 29-32"
  note: "Contains 'Release Model', representing repository policy."

## Change Scope

- `CONTRIBUTING.md`
- `docs/architecture/boundary.md`
- `docs/policy/release.md`
- `docs/procedures/verification.md`

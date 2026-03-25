---
label: "docs"
created_at: "2026-03-25"
author_role: "librarian"
confidence: "high"
---

## Problem

`docs/README.md` functions as a flat index that enumerates files without providing routing criteria, duplicating the documentation index found in the root `README.md`.

## Goal

Eliminate the redundant index by relying on the root `README.md` as the primary documentation entry point, or update `docs/README.md` to provide structural routing guidance based on user intent rather than just listing files.

## Context

"Indexes that enumerate files without routing criteria" is a documented anti-pattern. Having multiple locations claiming authority for the documentation index increases navigation entropy. First-time readers are forced to choose between `README.md` and `docs/README.md` for orientation, which breaks the rule that there should be exactly one canonical path for orientation.

## Evidence

- path: "docs/README.md"
  loc: "lines 1-14"
  note: "Enumerates files with brief descriptions but lacks structural routing based on intent."
- path: "README.md"
  loc: "lines 22-26"
  note: "Duplicates the documentation links found in docs/README.md, causing multiple locations to claim authority for the index."

## Change Scope

- `docs/README.md`
- `README.md`

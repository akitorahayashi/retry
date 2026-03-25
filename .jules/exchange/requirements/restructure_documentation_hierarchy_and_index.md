---
label: "docs"
implementation_ready: true
---

## Goal

Restructure the `docs/` directory to eliminate flat accumulation and redundant indexing by relocating `usage.md` into an appropriate subdirectory, using the root `README.md` as the primary index, and correcting technical drift regarding retry behaviors in documentation.

## Problem

The structural hierarchy within the `docs/` directory is inconsistent; `usage.md` is placed as a flat file at the top level while other topics use directories. `docs/README.md` functions as a flat index that merely enumerates files without structural routing guidance, duplicating the index found in the root `README.md`. Furthermore, `docs/usage.md` incorrectly states that the default standard workflow usage "retries non-zero command failures", implicitly omitting timeouts, which is contradicted by the `retry_on: 'any'` default policy.

## Evidence

- source_event: "inconsistent_docs_hierarchy_librarian.md"
  path: "docs/usage.md"
  loc: "entire file"
  note: "A flat file located at the top of docs/ while other topics use directories, hiding structural grouping intent."

- source_event: "redundant_docs_index_librarian.md"
  path: "docs/README.md"
  loc: "lines 1-14"
  note: "Enumerates files with brief descriptions but lacks structural routing based on intent."

- source_event: "redundant_docs_index_librarian.md"
  path: "README.md"
  loc: "lines 22-26"
  note: "Duplicates the documentation links found in docs/README.md, causing multiple locations to claim authority for the index."

- source_event: "retry_on_any_docs_consistency.md"
  path: "docs/usage.md"
  loc: "14"
  note: "States 'This configuration retries non-zero command failures up to three attempts.', omitting timeouts."

- source_event: "retry_on_any_docs_consistency.md"
  path: "src/domain/policy.ts"
  loc: "16-35"
  note: "The `shouldRetryFailure` function shows that both 'timeout' and 'error' outcomes are retried when `policy.retryOn` is 'any' (the default)."

## Change Scope

- `docs/usage.md` (renamed to `docs/guides/usage.md` or similar)
- `docs/README.md`
- `README.md`

## Constraints

- There should be exactly one canonical path for orientation/indexing.
- Documentation must conform to implementation behavior.
- Use capability-based subdirectories for topic groupings to prevent flat accumulation.

## Acceptance Criteria

- `docs/usage.md` is relocated to an appropriate subdirectory (e.g., `docs/guides/usage.md`).
- `docs/README.md` is removed or transformed to provide structural routing guidance instead of duplicating the index.
- Root `README.md` links are updated to reflect the new structure.
- Usage documentation accurately reflects that the default configuration retries both non-zero command failures and timeouts.

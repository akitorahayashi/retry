---
label: "<label>" # Must match a key in .jules/github-labels.json
created_at: "YYYY-MM-DD"
author_role: "<role>" # e.g. taxonomy
confidence: "low|medium|high"
---

## Problem

<concise statement of the problem or finding>

## Goal

<what needs to be achieved based on this finding>

## Context

<background, context, or reasons why this is a problem>

## Evidence

For multi-file events, add multiple list items.

- path: "<repo-relative path>"
  loc: "<line number, range, or symbol>"
  note: "<why this supports the problem/goal>"

## Change Scope

- `<repo-relative file/module path 1>`
- `<repo-relative file/module path 2>`

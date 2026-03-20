---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "high"
---

## Problem

The `RetryOn` concept is defined multiple times as a string union type (`'any' | 'error' | 'timeout'`) without a single source of truth.

## Goal

Unify the `RetryOn` definition so there is a single source of truth used across the domain and transport boundaries.

## Context

Following the Single Source of Truth principle, each fact or concept should have one canonical representation. Currently, the type is duplicated between the transport/DTO layer (`read-inputs.ts`) and the domain layer (`policy.ts`), which requires synchronization if new retry states are added.

## Evidence

- path: "src/domain/policy.ts"
  loc: "line 2"
  note: "Defines `export type RetryOn = 'any' | 'error' | 'timeout'`."
- path: "src/action/read-inputs.ts"
  loc: "line 3"
  note: "Duplicates the definition of `export type RetryOn = 'any' | 'error' | 'timeout'`."

## Change Scope

- `src/domain/policy.ts`
- `src/action/read-inputs.ts`

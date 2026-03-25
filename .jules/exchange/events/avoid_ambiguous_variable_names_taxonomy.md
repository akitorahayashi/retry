---
label: "refacts"
created_at: "2024-05-18"
author_role: "taxonomy"
confidence: "high"
---

## Problem

Variables related to handlers for process signals use ambiguous and informal naming (e.g., `onSigterm`, `onSigint`, `cleanupSignalHandlers`). This is inconsistent with the clear problem domain naming principle. Additionally, the term "handler" is vaguely used without a strong domain noun.

## Goal

Align signal handling variable and function names with clear domain-specific actions, explicitly identifying the lifecycle phase or bounded context.

## Context

In `src/app/execute-retry/execute-attempt.ts`, the function `registerCommandTerminationOnSignal` returns a teardown callback, which is locally bound to `cleanupSignalHandlers`. Using "cleanup" or "handlers" is generic. In `src/app/execute-retry/terminate-command-on-signal.ts`, the names `onSigterm`, `onSigint`, and `onSignal` are also generic event bindings rather than explicit domain actions. The observer contract explicitly calls out `generic 'handler'` as an anti-pattern.

## Evidence

- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "Line 28: const cleanupSignalHandlers = registerCommandTerminationOnSignal("
  note: "Uses generic 'cleanup' and 'handlers' instead of a precise teardown action like 'unregisterSignalHooks' or 'removeSignalListeners'."
- path: "src/app/execute-retry/terminate-command-on-signal.ts"
  loc: "Line 29: const onSigterm = () => {"
  note: "Uses generic 'onSigterm' event handler name."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/terminate-command-on-signal.ts`

---
label: "refacts"
implementation_ready: true
---

## Goal

Align signal handling variable and function names with clear domain-specific actions, explicitly identifying the lifecycle phase or bounded context, and avoid generic terms like `handler` and `cleanup`.

## Problem

Variables related to handlers for process signals use ambiguous and informal naming (e.g., `onSigterm`, `onSigint`, `cleanupSignalHandlers`). This is inconsistent with the clear problem domain naming principle. Additionally, the term "handler" is vaguely used without a strong domain noun.

## Evidence

- source_event: "avoid_ambiguous_variable_names_taxonomy.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "Line 28: const cleanupSignalHandlers = registerCommandTerminationOnSignal("
  note: "Uses generic 'cleanup' and 'handlers' instead of a precise teardown action like 'unregisterSignalHooks' or 'removeSignalListeners'."

- source_event: "avoid_ambiguous_variable_names_taxonomy.md"
  path: "src/app/execute-retry/terminate-command-on-signal.ts"
  loc: "Line 29: const onSigterm = () => {"
  note: "Uses generic 'onSigterm' event handler name."

## Change Scope

- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/terminate-command-on-signal.ts`

## Constraints

- Files and classes must identify single, specific responsibilities and avoid ambiguous names (e.g. `base`, `common`, `core`, `utils`, or `helpers`). Variable names must be precise and descriptive.

## Acceptance Criteria

- `cleanupSignalHandlers` is renamed to a more precise teardown action (e.g., `unregisterSignalHooks` or `removeSignalListeners`).
- `onSigterm`, `onSigint`, and `onSignal` in `terminate-command-on-signal.ts` are renamed to explicit domain actions.

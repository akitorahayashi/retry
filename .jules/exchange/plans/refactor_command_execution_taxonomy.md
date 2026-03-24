---
label: "refacts"
---

## Goal

Rename `CommandExecution` to `CommandSpec` to clearly reflect that it is a configuration or specification object, distinct from the active execution instance.

## Current State

The name `CommandExecution` incorrectly implies an active process or completed execution, creating ambiguity about the object's lifecycle phase when contrasted with `RunningCommand`.
- `src/domain/command.ts`: Defines `CommandExecution` as purely static configuration properties (`command`, `shell`, `timeoutSeconds`, `terminationGraceSeconds`). The name suggests an active execution rather than a blueprint.
- `src/app/execute-retry/execute-attempt.ts`: `executeAttempt` takes a `CommandExecution` and creates a `RunningCommand`. Using the word "Execution" for the input static configuration creates semantic confusion.
- `src/app/execute-retry/await-attempt-outcome.ts`: Accepts both a `CommandExecution` (for configuration like timeouts) and a `RunningCommand` (for the actual promise), which blurs the lines between static spec and active runtime state.
- `src/app/execute-retry/index.ts`: Implicitly relies on the structural compatibility of its parameters with `CommandExecution`.

## Plan

1. Rename `CommandExecution` to `CommandSpec` in `src/domain/command.ts`.
2. Update the import and type usage of `CommandExecution` to `CommandSpec` in `src/app/execute-retry/execute-attempt.ts`.
3. Update the import and type usage of `CommandExecution` to `CommandSpec` in `src/app/execute-retry/await-attempt-outcome.ts`.
4. Verify there are no residual mentions of `CommandExecution` across the codebase using remnant searches.

## Acceptance Criteria

- `CommandExecution` is completely replaced by `CommandSpec` in all domain and application files.
- The distinction between a static command specification (`CommandSpec`) and an active runtime execution (`RunningCommand`) is structurally clear.
- TypeScript compiler and linters pass successfully.
- Test suite continues to pass without any observable behavior change.

## Risks

- External systems or types implicitly coupling to `CommandExecution` might break if the structural signature changes, though a pure rename mitigates this risk.
- Remnant strings or comments referencing `CommandExecution` might be left behind, requiring comprehensive text search verification.

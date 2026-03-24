---
label: "refacts"
implementation_ready: false
---

## Goal

Rename `CommandExecution` to clearly reflect that it is a configuration or specification object, distinct from the active execution instance.

## Problem

The name `CommandExecution` is used in the domain layer to describe the *configuration* or *blueprint* of a command to be executed (its string, shell, timeouts), not the actual execution instance itself. In contrast, `RunningCommand` (in adapters) represents an active execution.

## Context

`src/domain/command.ts` defines `CommandExecution` which contains the string command, shell, and timeouts. This is passed to `executeAttempt` and `awaitAttemptOutcome`. However, the name implies an active process or a completed execution. The actual active process is represented by `RunningCommand` from the adapter layer. Using the word "Execution" for the static configuration creates ambiguity about the object's lifecycle phase. A name like `CommandBlueprint`, `CommandSpec`, or `CommandConfig` would more accurately reflect its role.

## Evidence

- source_event: "command_execution_blueprint_vs_instance_taxonomy.md"
  path: "src/domain/command.ts"
  loc: "lines 1-6"
  note: "Defines `CommandExecution` as purely static configuration properties (`command`, `shell`, `timeoutSeconds`, `terminationGraceSeconds`)."
- source_event: "command_execution_blueprint_vs_instance_taxonomy.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "lines 15-19"
  note: "`executeAttempt` takes a `CommandExecution` and creates a `RunningCommand`."
- source_event: "command_execution_blueprint_vs_instance_taxonomy.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "line 21"
  note: "`awaitAttemptOutcome` accepts both a `CommandExecution` (for config like timeouts) and a `RunningCommand` (for the actual promise)."

## Change Scope

- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/index.ts`
- `src/domain/command.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.

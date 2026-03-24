---
label: "refacts"
created_at: "2024-05-18"
author_role: "taxonomy"
confidence: "medium"
---

## Problem

The name `CommandExecution` is used in the domain layer to describe the *configuration* or *blueprint* of a command to be executed (its string, shell, timeouts), not the actual execution instance itself. In contrast, `RunningCommand` (in adapters) represents an active execution.

## Goal

Rename `CommandExecution` to clearly reflect that it is a configuration or specification object, distinct from the active execution instance.

## Context

`src/domain/command.ts` defines `CommandExecution` which contains the string command, shell, and timeouts. This is passed to `executeAttempt` and `awaitAttemptOutcome`. However, the name implies an active process or a completed execution. The actual active process is represented by `RunningCommand` from the adapter layer. Using the word "Execution" for the static configuration creates ambiguity about the object's lifecycle phase. A name like `CommandBlueprint`, `CommandSpec`, or `CommandConfig` would more accurately reflect its role.

## Evidence

- path: "src/domain/command.ts"
  loc: "lines 1-6"
  note: "Defines `CommandExecution` as purely static configuration properties (`command`, `shell`, `timeoutSeconds`, `terminationGraceSeconds`)."
- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "lines 15-19"
  note: "`executeAttempt` takes a `CommandExecution` and creates a `RunningCommand`."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "line 21"
  note: "`awaitAttemptOutcome` accepts both a `CommandExecution` (for config like timeouts) and a `RunningCommand` (for the actual promise)."

## Change Scope

- `src/domain/command.ts`
- `src/app/execute-retry/execute-attempt.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/index.ts`

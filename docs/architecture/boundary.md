# Architecture

## Repository Boundary

`retry` is a single-action repository.

The repository surfaces are:

- `action.yml`: public action contract
- `src/`: runtime implementation
- `tests/`: repository-owned tests aligned to runtime boundaries
- `dist/`: committed package output refreshed only by release automation
- `docs/`: usage, configuration, and architecture documentation
- `.github/workflows/`: CI and verification workflows

## Runtime Boundary Model

The runtime boundaries are:

- `src/index.ts`: bootstrap and top-level failure handling only
- `src/action/`: GitHub Actions input reading and output emission
- `src/app/`: retry use-case orchestration
- `src/domain/`: pure retry policy, schedule, and result logic
- `src/adapters/`: process execution, process termination, and waiting

## Dependency Direction

Runtime dependencies follow this direction:

```text
index -> action -> app -> domain
app -> adapters
domain -> none
adapters -> node runtime
```

`action` does not own retry policy. `domain` does not depend on GitHub Actions APIs or Node runtime APIs.

## Runtime Execution Flow

The action runtime executes this sequence:

1. Read and validate action inputs.
2. Execute one command attempt.
3. Resolve outcome as `success`, `error`, or `timeout`.
4. Apply retry policy and delay resolution.
5. Emit final outputs with attempts, outcome, and exit code.

## Failure Invariants

The action fails explicitly when:

- required inputs are missing
- numeric inputs are invalid
- retry policy values are invalid
- attempts are exhausted and `continue_on_error` is not enabled

No silent fallback paths are used.

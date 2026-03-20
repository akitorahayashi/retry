# Architecture

## Repository Boundary

`act-tmpl` is a single-action template repository. The repository owns a minimal GitHub Action that reads inputs, renders a message, and emits one output.

The repository surfaces are:

- `action.yml`: public action contract
- `src/`: TypeScript runtime organized by action, app, and domain boundaries
- `dist/`: committed package output used by GitHub Actions at tag resolution time
- `tests/`: repository-owned boundary tests under `tests/action`, `tests/app`, and `tests/domain`
- `scripts/verify-dist.mjs`: committed-distribution verification

## Runtime Boundaries

The runtime boundaries are:

- `src/index.ts`: bootstrap and top-level orchestration only
- `src/action/`: action boundary input reading, output emission, and request normalization
- `src/app/`: use-case orchestration for message rendering
- `src/domain/`: pure message template rendering

## Dependency Direction

Runtime dependencies follow this direction:

```text
index -> action -> app -> domain
action -> domain
domain -> none
```

`domain` remains pure and does not depend on `action` or `app`.

## Runtime Execution Flow

The action runtime executes this sequence:

1. Read required and optional action inputs.
2. Normalize an action request from input values.
3. Render the final message string.
4. Emit `rendered-message`.
5. Log the rendered value.

## Reusable Baseline

The repository demonstrates a reusable TypeScript GitHub Action baseline:

- `action.yml`
- minimal `src/index.ts` bootstrap
- boundary-owned runtime directories (`src/action`, `src/app`, `src/domain`)
- boundary-owned tests (`tests/action`, `tests/app`, `tests/domain`)
- standard validation and committed-output verification (`just`, `scripts/verify-dist.mjs`)

## Failure Invariants

The action fails explicitly when:

- the `message` input is missing or blank
- runtime boundaries receive invalid input values

No silent fallback paths are used.

# retry

`retry` is a single TypeScript GitHub Action repository.
The public contract is `action.yml`.
The authored runtime is under `src/`.
Tests are under `tests/`.
Documentation is under `docs/`.
Automation is under `.github/workflows/`.

## Documentation Routing

- [Usage](docs/guides/usage.md): workflow examples and outputs
- [Architecture Boundary](docs/architecture/boundary.md): runtime boundaries and flow
- [Action Inputs](docs/configuration/inputs.md): input and output reference

## Repository Layout

`action.yml` defines action inputs and outputs.
`src/` contains runtime boundaries (`action`, `app`, `domain`, `adapters`).
`tests/` verifies boundary behavior.
`docs/` contains usage and architecture references.
`.github/workflows/` contains static checks, tests, E2E validation, and release automation.

## Validation Entrypoints

`just fix` runs formatting and safe lint fixes.
`just check` runs format, lint, and typecheck validation.
`just test` runs the Vitest suite.

## Constraint

Normal development changes do not update `dist/`.

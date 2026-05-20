# Contributing

## Scope

`retry` is a single-action repository. The active runtime surface is the GitHub Action contract in `action.yml` and the TypeScript boundaries under `src/`.

## Local Verification

`just` is the canonical local entrypoint for repository tasks.

The repository-owned verification and maintenance recipes are:

- `just fix`: runs `pnpm format` and `pnpm lint:fix`
- `just check`: runs `pnpm format:check`, `pnpm lint`, and `pnpm typecheck`
- `just test`: runs `pnpm test`
- `just coverage`: resets `coverage/` and runs `pnpm test:coverage`
- `just clean`: removes repository-local generated artifacts under `.tmp`, `coverage`, and `node_modules`

`package.json` retains the atomic pnpm scripts behind these recipes:

- `pnpm format`
- `pnpm format:check`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm typecheck`
- `pnpm package`

## Distribution Boundary

`dist/` is committed because GitHub Actions executes repository contents directly from the tagged revision. Normal development changes do not update `dist/`.
Release automation on `main` runs `pnpm package`, commits `dist/` when changed, and then creates release tags.

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
Release automation is manually dispatched with an `X.Y.Z` input, validates it on `main`, creates `vX.Y.Z`, moves `v1`, and publishes the GitHub Release.

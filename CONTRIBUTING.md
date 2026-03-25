# Contributing

## Scope

`retry` is a single-action repository. The active runtime surface is the GitHub Action contract in `action.yml` and the TypeScript boundaries under `src/`.

## Local Verification

`just` is the canonical local entrypoint for repository tasks.

The repository-owned verification and maintenance recipes are:

- `just fix`: runs `npm run format` and `npm run lint:fix`
- `just check`: runs `npm run format:check`, `npm run lint`, and `npm run typecheck`
- `just test`: runs `npm test`
- `just coverage`: resets `coverage/` and runs `npm run test:coverage`
- `just clean`: removes repository-local generated artifacts under `.tmp`, `coverage`, and `node_modules`

`package.json` retains the atomic npm scripts behind these recipes:

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run lint:fix`
- `npm test`
- `npm run test:coverage`
- `npm run typecheck`
- `npm run package`

## Distribution Boundary

`dist/` is committed because GitHub Actions executes repository contents directly from the tagged revision. Normal development changes do not update `dist/`.
Release automation on `main` runs `npm run package`, commits `dist/` when changed, and then creates release tags.

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
Release automation is manually dispatched with an `X.Y.Z` input, validates it on `main`, creates `vX.Y.Z`, moves `v1`, and publishes the GitHub Release.

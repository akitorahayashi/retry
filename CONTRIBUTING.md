# Contributing

## Scope

`act-tmpl` is a single-action template repository. The active runtime surface is the GitHub Action contract in `action.yml`, the TypeScript boundaries under `src/`, and the committed package output in `dist/`.

## Local Verification

`just` is the canonical local entrypoint for repository tasks.

The repository-owned verification and maintenance recipes are:

- `just fix`: runs `npm run format`, `npm run lint:fix`, and `npm run package`
- `just check`: runs `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run verify:dist`
- `just test`: runs `npm test`
- `just package`: runs `npm run package`
- `just verify-dist`: runs `npm run verify:dist`
- `just clean`: removes repository-local generated artifacts under `.tmp`, `coverage`, and `node_modules`

`package.json` retains the atomic npm scripts behind these recipes:

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run lint:fix`
- `npm test`
- `npm run typecheck`
- `npm run package`
- `npm run verify:dist`

## Distribution Boundary

`dist/` is committed because GitHub Actions executes repository contents directly from the tagged revision. Source changes under `src/` are accompanied by regenerated `dist/` output before release tags move.

`scripts/verify-dist.mjs` compares committed `dist/` files against fresh `ncc` output in the repository-local `.tmp/` directory. Distribution drift is treated as a repository defect.

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
When a semver tag is pushed, the release workflow publishes the matching GitHub Release and then moves the corresponding major tag to the released commit.

## Documentation

`README.md` is the public front door. `docs/` owns task-oriented usage, durable architecture, and configuration reference surfaces.

# Verification

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

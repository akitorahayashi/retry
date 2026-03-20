# Usage

`act-tmpl` renders a final message string from action inputs.

## Standard Workflow Usage

```yaml
- uses: akitorahayashi/act-tmpl@v1
  with:
    message: hello world
```

This default form emits `hello world` as `rendered-message`.

## Input Behavior

The action reads:

- required `message`
- optional `prefix`
- optional `suffix`
- optional `uppercase`

The output surface is:

- `rendered-message`

## Rendering Example

```yaml
- uses: akitorahayashi/act-tmpl@v1
  with:
    message: world
    prefix: hello
    suffix: again
    uppercase: true
```

The emitted output in this example is `HELLO WORLD AGAIN`.

## Local Verification

Repository-local verification commands are:

- `just fix`
- `just check`
- `just test`
- `just package`
- `just verify-dist`

`just fix` refreshes committed `dist/` after source-side fixes.
`just check` includes committed `dist/` verification.

Targeted npm commands remain available behind the `just` recipes:

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run lint:fix`
- `npm test`
- `npm run typecheck`
- `npm run package`
- `npm run verify:dist`

# act-tmpl

`act-tmpl` is a TypeScript GitHub Action template repository. It ships a minimal but complete action that renders a message from inputs and emits the rendered value as an action output.

The repository demonstrates a reusable delivery foundation:

- committed `dist/` packaging and verification
- split reusable workflows under `.github/workflows/`
- `just` as the local task surface
- runtime boundaries organized as `index -> action -> app -> domain`

## Quick Start

```yaml
- uses: akitorahayashi/act-tmpl@v1
  with:
    message: hello world
    prefix: greeting
    suffix: done
    uppercase: false
```

## Action Contract

Inputs:

- `message` (required)
- `prefix` (optional)
- `suffix` (optional)
- `uppercase` (optional, default: false)

Outputs:

- `rendered-message`

## Runtime Flow

1. Read inputs from the GitHub Actions boundary.
2. Normalize inputs into an action request.
3. Render a final string in the app and domain boundaries.
4. Emit `rendered-message`.
5. Log the rendered value.

## Documentation

- [Usage](docs/usage.md)
- [Architecture Boundary](docs/architecture/boundary.md)
- [Action Inputs](docs/configuration/inputs.md)

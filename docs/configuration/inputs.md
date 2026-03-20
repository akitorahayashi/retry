# Inputs

`act-tmpl` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `message` | yes | none | Base message text to render |
| `prefix` | no | empty | Optional text inserted before the message |
| `suffix` | no | empty | Optional text appended after the message |
| `uppercase` | no | empty | Optional flag (`true`, `1`, `yes`, `on`) to uppercase the rendered value |

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `rendered-message` | Final rendered message after prefix/suffix composition and optional uppercasing |

## Boolean Semantics

`uppercase` resolves to `false` when absent or when its value is not one of the supported truthy tokens.


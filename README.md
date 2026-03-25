# retry

`retry` is a TypeScript GitHub Action that executes one command with retry and timeout policy controls.

The action owns:

- retry attempt control
- per-attempt timeout control
- retry delays (fixed and schedule-based)
- retry decision by failure class and exit-code filters
- explicit outputs for execution outcome

## Quick Start

```yaml
- uses: akitorahayashi/retry@v1
  with:
    command: npm test
    max_attempts: '3'
    timeout_seconds: '120'
    retry_delay_seconds: '5'
```

## Documentation

- [Usage](docs/usage.md)
- [Architecture Boundary](docs/architecture/boundary.md)
- [Action Inputs](docs/configuration/inputs.md)

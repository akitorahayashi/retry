# retry

`retry` is a TypeScript GitHub Action that executes one command with retry and timeout policy controls.

The action owns:

- retry attempt control
- per-attempt timeout control
- retry delays (fixed and schedule-based)
- retry decision by failure class and exit-code filters
- explicit outputs for final execution outcome

## Quick Start

```yaml
- uses: akitorahayashi/retry@v1
  with:
    command: npm test
    max_attempts: '3'
    timeout_seconds: '120'
    retry_delay_seconds: '5'
```

## Action Contract

Inputs:

- `command` (required)
- `max_attempts` (required)
- `shell` (optional, default: `bash`)
- `timeout_seconds` (optional)
- `retry_delay_seconds` (optional, default: `'0'`)
- `retry_delay_schedule_seconds` (optional)
- `retry_on` (optional, `any | error | timeout`, default: `any`)
- `retry_on_exit_codes` (optional)
- `continue_on_error` (optional, default: `false`)
- `termination_grace_seconds` (optional, default: `'5'`)

Outputs:

- `attempts`
- `final_exit_code`
- `final_outcome`
- `succeeded`
- `final_stdout`

## Runtime Flow

1. Read and validate retry action inputs.
2. Execute one command attempt.
3. Apply timeout, termination, and retry policy.
4. Wait between attempts when retries are allowed.
5. Emit final outputs describing outcome, attempts, and final stdout.

## Documentation

- [Usage](docs/usage.md)
- [Architecture Boundary](docs/architecture/boundary.md)
- [Action Inputs](docs/configuration/inputs.md)

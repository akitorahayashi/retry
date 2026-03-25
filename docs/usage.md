# Usage

`retry` executes one command per attempt until success or retry exhaustion.

The repository-owned end-to-end verification path targets Linux runners.

## Standard Workflow Usage

```yaml
- uses: akitorahayashi/retry@v1
  with:
    command: npm test
    max_attempts: '3'
```

This configuration retries non-zero command failures up to three attempts.

## Structured Output Example

```yaml
- id: run
  uses: akitorahayashi/retry@v1
  with:
    command: printf '%s\n' '{"status":"ok","count":2}'
    max_attempts: '7'
    retry_delay_schedule_seconds: '1,2,4,8,16,32'

- run: |
    set -euo pipefail
    echo "$FINAL_STDOUT"
  env:
    FINAL_STDOUT: ${{ steps.run.outputs.final_stdout }}

```

## Timeout-Only Retry Example

```yaml
- uses: akitorahayashi/retry@v1
  with:
    command: ./scripts/check-service.sh
    max_attempts: '5'
    timeout_seconds: '45'
    retry_on: timeout
    retry_delay_schedule_seconds: '1,2,5,10'
    termination_grace_seconds: '3'
```

This configuration retries only timeout failures and applies attempt-specific delays.

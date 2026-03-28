# Inputs

`retry` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `command` | yes | none | Command string executed on each attempt |
| `max_attempts` | yes | none | Maximum number of attempts before exhaustion |
| `shell` | no | `bash` | Shell executable used to run `command` on Linux runners |
| `timeout_seconds` | no | none | Per-attempt timeout in seconds |
| `retry_delay_seconds` | no | `0` | Default delay in seconds before the next retry |
| `retry_delay_schedule_seconds` | no | none | Comma-separated retry delays per retry index |
| `retry_on` | no | `any` | Retry failure class (`any`, `error`, `timeout`) |
| `retry_on_exit_codes` | no | none | Comma-separated retryable exit codes |
| `continue_on_error` | no | `false` | Keep the workflow step successful after exhaustion |
| `termination_grace_seconds` | no | `5` | Delay before forced termination after graceful timeout stop |

`retry_delay_schedule_seconds` is authoritative when present. `retry_delay_seconds` remains the fallback delay when a retry index does not have a schedule value.

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `attempts` | Number of attempts that executed |
| `final_exit_code` | Final command exit code, or `'none'` when no code is available |
| `final_outcome` | Final attempt outcome (`success`, `error`, `timeout`) |
| `succeeded` | `true` when any attempt succeeded, otherwise `false` |
| `final_stdout` | Stdout emitted by the final attempt |

## Boolean Semantics

`continue_on_error` accepts `1`, `0`, `true`, `false`, `yes`, `no`, `on`, or `off`.
Any other non-empty token fails input validation.

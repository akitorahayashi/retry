#!/usr/bin/env bash
set -euo pipefail

exit_code="${1:-1}"
echo "failing with exit code ${exit_code}"
exit "$exit_code"
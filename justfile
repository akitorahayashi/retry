set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default: help

help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Development tasks for act-tmpl:"
    @just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Install repository dependencies from the lockfile
setup:
    npm ci

# Apply formatter, safe lint fixes, and refresh committed dist
fix:
    npm run format
    npm run lint:fix
    npm run package

# Run formatting checks, lint, typecheck, and dist verification
check:
    npm run format:check
    npm run lint
    npm run typecheck
    npm run verify:dist

# Run test suite
test:
    npm run test

# Build committed GitHub Action distribution
package:
    npm run package

# Verify committed dist output matches generated output
verify-dist:
    npm run verify:dist

# Remove repository-local generated artifacts
clean:
    rm -rf .tmp coverage node_modules

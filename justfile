set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default: help

help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Development tasks for retry:"
    @mise exec -- just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Install repository dependencies from the lockfile
setup *args:
    pnpm install {{ args }}

# Apply formatter and safe lint fixes
fix:
    pnpm format
    pnpm lint:fix

# Run formatting checks, lint, and typecheck
check:
    pnpm format:check
    pnpm lint
    pnpm typecheck

# Run test suite
test:
    pnpm test

# Generate coverage report
coverage:
    rm -rf coverage
    pnpm test:coverage

# Remove repository-local generated artifacts
clean:
    rm -rf .tmp coverage node_modules

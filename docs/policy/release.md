# Release Policy

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
Release automation is manually dispatched with an `X.Y.Z` input, validates it on `main`, creates `vX.Y.Z`, moves `v1`, and publishes the GitHub Release.

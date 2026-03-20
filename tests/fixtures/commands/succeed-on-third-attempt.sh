#!/usr/bin/env bash
set -euo pipefail

state_file="$1"
count=0

if [[ -f "$state_file" ]]; then
  count="$(cat "$state_file")"
fi

count="$((count + 1))"
echo "$count" >"$state_file"

if [[ "$count" -lt 3 ]]; then
  echo "failing attempt $count"
  exit 1
fi

echo "succeeding attempt $count"
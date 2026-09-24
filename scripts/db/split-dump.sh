#!/usr/bin/env bash
set -euo pipefail

chunk_size="45m"
threshold_bytes=$((45 * 1024 * 1024))

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <dump-file>" >&2
  exit 1
fi

dump="$1"
if [[ ! -f "${dump}" ]]; then
  echo "[split-dump] no such file: ${dump}" >&2
  exit 1
fi

size=$(stat -f%z "${dump}" 2>/dev/null || stat -c%s "${dump}")
if ((size <= threshold_bytes)); then
  echo "[split-dump] ${dump} is $((size / 1024 / 1024))MiB, under ${chunk_size}; leaving as a single file"
  exit 0
fi

echo "[split-dump] ${dump} is $((size / 1024 / 1024))MiB; splitting into ${chunk_size} parts..."
split -b "${chunk_size}" "${dump}" "${dump}.part-"
rm -f "${dump}"

parts=("${dump}".part-*)
echo "[split-dump] done: ${#parts[@]} parts"
ls -lh "${parts[@]}"

#!/usr/bin/env bash

REMOTE_HOST="${REMOTE_HOST:-qafiyah}"
REMOTE_DIR="${REMOTE_DIR:-/opt/qafiyah}"

remote_exec() {
  {
    for helper in "$@"; do cat "$helper"; done
    printf 'REMOTE_DIR=%q\n' "$REMOTE_DIR"
    cat
  } | ssh "$REMOTE_HOST" 'bash -s'
}

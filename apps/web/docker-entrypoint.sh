#!/bin/sh
for name in INTERNAL_API_KEY SESSION_STATE_SECRET; do
  if [ -z "$(printenv "$name")" ]; then
    echo "[web] $name is empty, refusing to start" >&2
    exit 1
  fi
done

HOST="${HOST:-127.0.0.1}" PORT="${SSR_PORT:-4321}" bun /app/apps/web/dist/server/entry.mjs &
ssr=$!
nginx -g 'daemon off;' &
ngx=$!

term() {
  kill -QUIT "$ngx" 2>/dev/null
  wait "$ngx" 2>/dev/null
  kill -TERM "$ssr" 2>/dev/null
  wait "$ssr" 2>/dev/null
  exit 0
}
trap term TERM INT

while kill -0 "$ssr" 2>/dev/null && kill -0 "$ngx" 2>/dev/null; do
  sleep 5
done

kill "$ssr" "$ngx" 2>/dev/null
exit 1

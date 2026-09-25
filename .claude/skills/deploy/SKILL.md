---
name: deploy
description: Deploy, release data/index changes to, or roll back the qafiyah production VPS stack or the telemetry-proxy Cloudflare Worker. Use when the user asks to deploy, ship to prod, release, or roll back.
disable-model-invocation: true
---

Full architecture and "why" live in `docs/deployment/`. This is only the ordered steps. Link out rather than re-explaining.

## 1. Deploy the VPS stack (api, web, search-indexer, db, es, edge-gateway)

From a dev machine with the repo checked out and SSH access:

**First, refresh the taxonomy filter options** (`apps/web/src/lib/generated/taxonomy/taxonomy-options.gen.ts`, the eras/meters/rhymes/themes/collections shown in the home page search filters) so they reflect what's actually in the production database, then commit and push before shipping:

```bash
bun run taxonomy:generate:check   # fails if the committed file is stale against the live prod API
bun run taxonomy:generate         # regenerates it from https://api.qafiyah.com/v1
# if it changed: commit apps/web/src/lib/generated/taxonomy/taxonomy-options.gen.ts and push to main
```

This is a separate step from the build below because it runs from a dev machine against the public prod API (`bun` is not installed on the host, and the file must already be on `origin/main` before the deploy builds the `web` image from it).

Then:

```bash
bun run deploy        # scripts/deploy/vps.sh
```

It first confirms the GitHub CI run for `origin/main` passed and refuses otherwise (still running, failed, or never ran); `bun run deploy --skip-ci-check` skips that in an emergency. This builds, then does a zero-downtime rolling replace of `api`/`web`, then smoke-gates, purges the Cloudflare cache (a failed purge exits non-zero: purge everything in the Cloudflare dashboard right away), and prunes build cache, see `docs/deployment/architecture.md` for what it does internally. `bun` is not installed on the host; this always runs from your dev machine.

**Verify after it finishes:**

```bash
bun run api:conformance prod   # replays every documented API operation against the live schema
```

`docker compose ps` on the host should show all 6 containers healthy/exited-0.

## 2. Rolling back a bad deploy

**There is no separate rollback script.** `bun run deploy` always syncs the host to the current tip of `origin/main` (`git reset --hard FETCH_HEAD`). A bad build is already fail-safe (the old replica keeps serving until the new one passes its healthcheck, so it can't half-ship). To undo a deploy that _did_ complete: revert or reset `main` to the last-good commit, then run `bun run deploy` again the same way, once CI passes on that commit (or with `--skip-ci-check` if it can't wait). There is no faster path in this repo today.

## 3. Ship a new Postgres/Elasticsearch dump to prod (release data)

A normal deploy preserves the data volume, so a new dump in `data/db/` is ignored until it is restored.

```bash
bun run db:reseed     # push-button: syncs to origin/main, restores the newest dump into the corpus database, rebuilds es
```

Replaces the corpus database (`qafiyah`) only; `qafiyah_accounts` is untouched. The API is stopped during the restore (a few minutes, nginx keeps serving cached pages), then Elasticsearch is rebuilt with an alias swap while the API serves. It needs the newest dump's `DUMP_KEY__<dir>` in `secrets/prod.enc.env` and refuses to start without it. It does not rebuild images, so deploy first when `main` has code changes. Prompts for confirmation unless run with `-y`. Details: `docs/deployment/environments.md`.

## 4. Rebuild the search index only (fix ES drift, no data change)

```bash
bun run reindex:prod
# equivalent, run on the host from /opt/qafiyah:
docker compose run --rm -e SEARCH_INDEXER_FORCE=true search-indexer
```

## 5. Major Postgres/Elasticsearch version bump

Not a normal deploy: a major image needs a volume wipe or it crash-loops. Ordered steps: `docs/deployment/troubleshooting.md`.

## 6. Enforce the WAF (flip ModSecurity from DetectionOnly to On)

Only when logs are clean against real Arabic-query traffic (background/validation history: `docs/deployment/services.md`).

```bash
# 1. Watch for would-be blocks first (audit-only in DetectionOnly mode):
docker compose logs -f edge-gateway | grep -i modsecurity   # esp. /v1/search and Arabic query strings

# 2. Sanity-check routing still works:
curl -s -H 'Host: qafiyah.com'     http://127.0.0.1:80/healthz -o /dev/null -w 'apex %{http_code}\n'
curl -s -H 'Host: api.qafiyah.com' http://127.0.0.1:80/v1/docs -o /dev/null -w 'api  %{http_code}\n'

# 3. When clean, flip it:
#    set MODSEC_RULE_ENGINE: On in docker-compose.yml, commit, then run step 1 (bun run deploy).
```

If a legitimate request keeps tripping a rule afterward, exclude that rule id (CRS tuning), do **not** drop `BLOCKING_PARANOIA` to 0.

**Rollback (bypass the WAF entirely):** move the host bind back to `web` (`ports: ["127.0.0.1:80:8080"]` on the `web` service), drop the `edge-gateway` service, redeploy. The tunnel config needs no change.

## 7. Deploy the telemetry proxy (Cloudflare Worker, separate from the VPS stack)

After `bunx wrangler login` or with `CLOUDFLARE_API_TOKEN` set:

```bash
cd apps/telemetry-proxy
bun run deploy        # wrangler deploy
```

Independent of step 1: a change to the Worker itself (`apps/telemetry-proxy/`) needs this; a change to how the web app _calls_ it needs step 1 instead. Details: `apps/telemetry-proxy/AGENTS.md`.

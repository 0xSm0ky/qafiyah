# Telemetry Proxy Agent Guide

Cloudflare Worker on `t.qafiyah.com` that forwards browser Sentry envelopes from qafiyah.com to Sentry, so a first-party hostname carries them past tracker-blockers and nothing telemetry-related touches the VPS or the WAF. One file, `src/index.ts`, no runtime dependencies. Where it sits in the traffic map: `docs/topology.md`.

## Behavior

- `POST /api/<projectId>/envelope/` is the only route. The project id must be in `SENTRY_ALLOWED_PROJECT_IDS` (403 otherwise); any other path is 404 (except `OPTIONS`, answered first, see below); any other method on the route is 405.
- `OPTIONS` answers CORS preflight for `https://qafiyah.com` and `https://www.qafiyah.com` only (`ALLOWED_ORIGINS`), and every proxied response carries the same CORS headers.
- Only `Content-Type`, `Content-Encoding`, `Origin`, and `Referer` are forwarded upstream; the body passes through untouched.

## Deploying

Not part of `docker compose`. `bun run deploy` in this directory runs `wrangler deploy` (after `bunx wrangler login`, or with `CLOUDFLARE_API_TOKEN` set). `wrangler.jsonc` binds the custom domain `t.qafiyah.com` and enables Workers observability; `bunx wrangler tail` streams live logs. The ordered steps are in `.claude/skills/deploy/SKILL.md` (step 7).

A change here needs `wrangler deploy`. A change to how the web app calls it (the Sentry DSN host and the CSP `connect-src` in `apps/web`) ships with the normal VPS deploy instead. Keep the hostname neutral (no `sentry` or `analytics` in it) so tracker-blockers do not pattern-match it.

# Deployment

> **Canonical & in-repo.** Every deploy refreshes the host copy at `/opt/qafiyah` (`git reset --hard origin/main`), edit here, commit, deploy. Nothing to sync by hand.
>
> **Keep this doc set secret-free.** No credentials, tokens, real IPs, or Cloudflare Tunnel IDs (clones, CI logs, and future contributors see it). Document _where_ secrets live (the gitignored `.env`), never their values; read host-specific identifiers off the live box (e.g. `cloudflared tunnel list`).

Production deploy + on-box operator runbook for **api, search-indexer, web** (Docker Compose on a single VPS, fronted by Cloudflare) and the **telemetry-proxy** Cloudflare Worker. For local dev use `bun run dev`.

Pick the part you need:

- **Deploying, releasing, or rolling back?** Run the `deploy` skill (`.claude/skills/deploy/SKILL.md`), it's the ordered runbook: VPS deploy, rollback, shipping a new DB/ES dump, reindexing, a major Postgres/ES version bump, the WAF DetectionOnly→On rollout, and the telemetry-proxy Worker deploy. It's manual-only (`disable-model-invocation: true`), so ask for it or invoke it explicitly.
- **Understanding how the system is built?** `docs/deployment/architecture.md`: Cloudflare Tunnel/edge-gateway traffic flow, the container stack, prod/dev isolation, security posture, and what a deploy automates internally.
- **Setting up or configuring an environment?** `docs/deployment/environments.md`: VPS prerequisites, first-boot seeding, secrets, and the API key gating env vars.
- **Working on a specific service?** `docs/deployment/services.md`: api, web (caching/nginx/TLS), the telemetry-proxy, the edge-gateway/WAF, and the search-indexer.
- **Managing secrets, or setting up a machine to decrypt them?** `docs/deployment/secrets.md`: SOPS + age, the schema every key must pass, and what each machine needs.
- **Something broken, or doing an ops task?** `docs/deployment/troubleshooting.md`: common host commands, gotchas, and the major-version-bump recovery.

## See also

- `docs/topology.md`: diagram-first map of the whole system, code and production
- `data/db/MAINTAINERS_GUIDE.md`: database dump workflow

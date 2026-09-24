# Inspector Agent Guide

Dev-only Bun app. Renders a single HTML report showing metadata for one live example of every distinct page type on `apps/web`. Not deployed, not for production use.

## Shape

- `src/route-discovery.ts`: scans `apps/web/src/pages/` (plain filesystem read, not a module import) and turns Astro's file-based routing conventions into "route shapes", the ground truth of every distinct page type that should exist. Self-updating: add, remove, or rename a page in `apps/web` and Inspector's report reflects it on the next load with no changes here.
- `src/site-crawl.ts`: resolves one live URL per shape. Static shapes are fetched directly; dynamic shapes (`[slug]` routes) are resolved with a small bounded same-origin crawl, following `href`s found on already-fetched pages until every shape has a sample or a 30-fetch budget runs out. A shape that stays unresolved is a real signal, not a bug: it means the live site currently has no reachable example of that page type.
- `src/inspector.ts`: the extension point, a plain `Inspector` interface (`id`, `title`, `inspect(subject)`). Every report type conforms to it.
- `src/inspectors/`: one file per report type. `page-metadata.ts` is the only one so far, checking the same OG/Twitter/canonical/JSON-LD/title thresholds as the smoke `seo` suite (`scripts/smoke/suites/seo.ts`, deliberately duplicated in two small independent places rather than shared). Add a new report type by dropping in a new file here exporting an `Inspector` and appending it to the `INSPECTORS` registry array in `src/index.ts`; nothing else in the pipeline changes.
- `src/render.ts`: builds the final report page, plain HTML/CSS, no client JS.
- `src/index.ts`: `Bun.serve()` entrypoint; every request re-runs discovery, crawl, inspection, and rendering from scratch, so the report always reflects the live `apps/web` dev server, never a stale snapshot.
- Runs on `DEV_INSPECTOR_PORT` (from the root `config.ts`, imported as `@qafiyah/config`, default 4322) and targets `WEB_BASE_URL` (default `http://localhost:${DEV_WEB_PORT}`). Auto-started by `scripts/dev/run.ts` after the web app reports ready, only when `bun run dev --inspector` is passed.

## Deliberate, non-obvious behavior

See the Inspector section of `docs/exceptions.md`.

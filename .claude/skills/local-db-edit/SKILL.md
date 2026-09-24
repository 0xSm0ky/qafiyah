---
name: local-db-edit
description: Use when about to make a direct manual edit to the qafiyah Postgres database, adding an index, deleting or fixing a row, altering a table, or any other ad-hoc change outside a normal migration. Also covers producing and encrypting the resulting dump snapshot afterward.
---

# DB Task

Wraps a manual edit to the local qafiyah Postgres database (seeded from a `data/db/` dump) with the checks that keep it safe: confirm the edit lands on the latest dump, unlock the passphrase needed to load it, then snapshot and re-encrypt afterward.

**Local only.** Every step here runs through `./scripts/dev/compose.sh exec db ...`, i.e. _inside_ the Docker `db` container started by `bun run db:up`, never a host-network connection to any other Postgres. Never point any command in this skill at a production host, tunnel, or `DATABASE_URL`. If the task actually requires touching production data, stop and say so instead of improvising a prod connection, that's a separate, deliberate action outside this skill.

Running inside the container this way needs no local `psql`/`pg_dump` install, no password (local socket trust auth), and always matches the server's Postgres version exactly, don't reach for a host-installed client instead.

## 1. Verify the latest dump is loaded

```bash
scripts/db/resolve-dump.sh
```

Compare its `using {dump}` line against the real latest: `ls -d data/db/*/ | xargs -n1 basename | grep -v 0000_default | sort | tail -1` (plain `ls data/db/ | sort | tail -1` picks up `keys.manifest`, which sorts after the numbered dirs, don't use that form).

- Matches: continue.
- Behind, or fell back to `0000_default`: stop and ask the user whether to continue on the stale/sample data or get the latest dump's passphrase first.

## 2. Get the passphrase

Ask the user for the passphrase to the dump being worked on, don't guess or reuse an old one. Then:

```bash
bun run dump:key:set   # pick the dump, paste the passphrase; saves to secrets/dev.enc.env and regenerates .env
bun run db:reset       # wipes the volume, reseeds from the now-unlocked dump
```

## 3. Capture the "before" state

Know which table(s) the edit will touch before making it (you always do, that's what "add an index to `poems`" or "delete a row from `poets`" already tells you). Snapshot just those, into a scratch directory outside the repo (your session's scratchpad directory is ideal, call it `$BEFORE` below):

```bash
scripts/db/snapshot-state.sh "$BEFORE" {table}...
```

This captures the full schema (cheap) plus a primary-key-ordered CSV per named table, it deliberately does _not_ snapshot every table: `poem_verses`/`verses`/`poem_relations` run into the millions of rows, a blind full-corpus diff on every task would be far too slow. Only pass the table(s) actually in scope.

## 4. Make the edit

```bash
./scripts/dev/compose.sh exec db psql -U qafiyah -d qafiyah
```

Or pipe/mount in a one-off SQL file, whatever the task calls for.

## 5. Snapshot, diff, and encrypt

Pick the new dump's directory name first (next sequence: same `ls -d data/db/*/ | xargs -n1 basename | grep -v 0000_default | sort | tail -1` as step 1, then `{N+1:04d}_{DD}_{MM}_{YYYY}`), it's `{new-dir}` below throughout:

```bash
scripts/db/snapshot-state.sh "$AFTER" {table}...
scripts/db/diff-state.sh "$BEFORE" "$AFTER" data/db/{new-dir}/CHANGES.md
```

`diff-state.sh` creates `data/db/{new-dir}/` if it doesn't exist yet. Then the real physical dump, written straight into that directory, no separate move step:

```bash
./scripts/dev/compose.sh exec -T db psql -U qafiyah -d qafiyah -v ON_ERROR_STOP=1 -c 'SELECT public.refresh_poem_relations();'
./scripts/dev/compose.sh exec -T db pg_dump -U qafiyah -d qafiyah --schema=public --no-owner --no-privileges --no-tablespaces -Fc >data/db/{new-dir}/qafiyah_public_$(date +%Y%m%d_%H%M%S).dump
```

Split if over 45MB:

```bash
scripts/db/split-dump.sh data/db/{new-dir}/qafiyah_public_{timestamp}.dump
```

Ask the user for a fresh passphrase, it must be unique or `encrypt-dump.sh` refuses it, then:

```bash
DUMP_KEY__{new-dir}={new-passphrase} scripts/db/encrypt-dump.sh data/db/{new-dir}
```

This encrypts every plaintext `.dump`/`.dump.part-*` file in that directory _and_ `CHANGES.md` if present, with the same passphrase, so the one dump key decrypts both.

Then store the passphrase with `bun run dump:key:set` (pick `{new-dir}`), so it lands in `secrets/dev.enc.env`. A passphrase that only lived in the shell is lost with it.

Then finish the "Post-dump checklist" in `data/db/MAINTAINERS_GUIDE.md` from "Restores cleanly" onward (fallback sample, add-only commit, shipping to production).

# Database Dumps

PostgreSQL custom-format (`pg_dump -Fc`) snapshots of the `public` schema.

## Open, passphrase on request

These dumps are public and carry the same MIT license as the rest of the repo.
They're encrypted, not restricted.

Why encrypt something that is open? Because a public git history cannot be
edited after the fact. Once a plaintext dump is pushed, every fork, clone, and
mirror keeps it for good, and nothing the maintainers do afterwards can take it
back. If a record ever has to come out of the corpus, for whatever reason, it
must be possible to remove it everywhere it went. Encryption keeps that
possible: the plaintext copies are the ones handed out on request, so there is
always a way to reach whoever holds one. It's a record of where copies went, not
a gate on who gets one.

Getting a passphrase is quick. Email dumps@qafiyah.com, name the dump you want,
and say what you need it for, whether that is your own use or a contribution you
are planning. You get the passphrase right away. There is no vetting, and nobody
has to qualify.

If you'd rather not wait on a reply: `data/db/0000_default/` is plaintext and needs
no passphrase (see "Fallback sample dataset" below), and the read-only public API
at <https://api.qafiyah.com/v1/docs> serves the same corpus without any of this.

## Directory naming

Each dump lives in `{sequence}_{DD}_{MM}_{YYYY}`, where `{sequence}` is a zero-padded four-digit sort index. E.g. `0003_29_01_2026` is the third dump, from 29 January 2026. The highest-numbered directory is always current.

A dump over ~45MB is committed as `{name}.dump.part-aa`, `.part-ab`, … instead of one `{name}.dump` file, to stay under GitHub's file size limits (see `MAINTAINERS_GUIDE.md`). `bun run db:up`/`db:reset` reassemble these automatically; manual restores need `cat` first (below).

## Encryption

Every real dump here is encrypted with its own passphrase (`openssl enc`,
one `.dump.part-*.enc` file per part) before it's committed, nothing
sensitive sits in git history in the clear. `data/db/keys.manifest` records a
salted hash per dump for uniqueness checking only; it never contains a
passphrase. See `MAINTAINERS_GUIDE.md` for how a new dump gets encrypted.

Some dump directories also carry a `CHANGES.md` (schema/data diff against the previous dump, produced via the `local-db-edit` skill for ad-hoc manual edits). It's encrypted the same way, as `CHANGES.md.enc`, with the same passphrase as the dump it belongs to, so one key decrypts both.

## Fallback sample dataset

`data/db/0000_default/` is a small (100 poems, with everything they
reference), always-plaintext, always-committed sample. It's never
encrypted and needs no passphrase. It exists so `bun run dev` works
immediately for anyone who hasn't been given a real dump's passphrase; see
"Restore (local development)" below for how it gets picked.

The 100 poems are all from the Jahili (pre-Islamic) era specifically, not a
random slice of the corpus (the oldest era here), so it's a small,
self-contained subset to ship in the clear. Every taxonomy table (eras,
meters, rhymes, themes, etc.) stays fully intact regardless, they're category
labels, not corpus content, and the UI's filters need the full set to work.

## Requirements

`pg_restore` from a PostgreSQL whose major version is ≥ the one a dump was produced with. An older PostgreSQL may report an unsupported dump format version.

## Restore (local development)

The database self-seeds: `bun run db:up` spins up Postgres in Docker and
restores a dump on a fresh volume (or `bun run dev` to also start the app).
Which dump it restores depends on `DUMP_KEY__<dump-dir>` environment
variables (kept in `secrets/dev.enc.env`, see `docs/deployment/secrets.md`): the newest real dump you have a working passphrase
for, or the small `data/db/0000_default/` sample dataset otherwise.
Run `bun run dump:key:set` to pick a dump and set its passphrase. It
prompts, verifies the passphrase actually works, and saves it to
`secrets/dev.enc.env`, then regenerates `.env`.

Decrypting writes plaintext next to the `.enc` files (gitignored); removing
a key doesn't delete that plaintext, so a dump you've already
decrypted once keeps being used until you remove it yourself
(`git clean -Xd data/db/`) or `bun run db:reset` on a dump you never had a
key for in the first place.

To force a re-restore on an existing volume:

```bash
bun run db:up       # or: bun run db:reset to wipe the volume + re-seed
```

## Restore (manual / external use)

Real dumps are encrypted, decrypt with the dump's passphrase first (email
dumps@qafiyah.com if you need one):

```bash
DIR=$(ls -d data/db/*/ | grep -v 0000_default | sort | tail -1)   # newest real dump directory
for f in "$DIR"/*.enc; do
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass pass:"<passphrase>" -in "$f" -out "${f%.enc}"
done
```

Then reassemble/restore as usual:

```bash
if ls "$DIR"/*.dump >/dev/null 2>&1; then
  DUMP=$(ls "$DIR"/*.dump)
else
  DUMP=$(mktemp)
  cat "$DIR"/*.dump.part-* > "$DUMP"   # dump was split, reassemble first
fi
dropdb --if-exists qafiyah && createdb qafiyah && \
pg_restore \
  -U qafiyah \
  -d qafiyah \
  --no-owner \
  --no-privileges \
  "$DUMP"
```

`data/db/0000_default/qafiyah_public_sample.dump` needs none of this, it's
already plaintext.

## Verify

```bash
psql -U qafiyah -d qafiyah -c "\dt"
psql -U qafiyah -d qafiyah -c "SELECT count(*) FROM poems;"
```

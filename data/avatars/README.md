# Avatar Snapshots

Versioned zip snapshots of poet avatar images, mirroring the `data/db/` directory pattern.

## Open, passphrase on request

These snapshots are public and dedicated to the public domain under [CC0 1.0](../LICENSE), and
every image in them is already served in the clear at `cdn.qafiyah.com/poets/<slug>/avatar.webp`.
Nothing here is withheld; the zips are encrypted, not restricted.

Why encrypt something that is open? Because a public git history cannot be edited after the fact.
Once a plaintext zip of every avatar is pushed, every fork, clone, and mirror keeps it for good, and
nothing the maintainers do afterwards can take it back. If an image ever has to come out, for
whatever reason, it must be possible to remove it everywhere it went. Encryption keeps that
possible: the plaintext copies are the ones handed out on request, so there is always a way to
reach whoever holds one. Same reasoning as `data/db/`.

Getting a passphrase is quick. Email avatars@qafiyah.com and say what you need the snapshot for,
whether that is your own use or a contribution you are planning. You get the passphrase right away.
There is no vetting, and nobody has to qualify.

## Directory naming

Each snapshot lives in `{sequence}_{DD}_{MM}_{YYYY}`, the same scheme as `data/db/`. E.g. `0000_19_09_2026` is the first snapshot, from 19 September 2026.

## Contents

Each snapshot is `avatars.zip`, split and encrypted the same way DB dumps are (below). Unzipped, it contains one folder per poet:

```
poets/<slug>/avatar.webp
```

matching the object keys already live in R2 (bucket `qafiyah-assets`, served publicly at `cdn.qafiyah.com/poets/<slug>/avatar.webp`). This directory is a backup/archival copy, not the serving path, the app reads avatars from R2/`cdn.qafiyah.com`, never from here.

## Uploading a batch to R2

The dashboard caps drag-and-drop at 100 files, so a real batch needs the CLI. There is no script
for this yet, the last run (6,631 avatars) was a shell loop over `wrangler r2 object put`:

```bash
find <src-dir> -maxdepth 1 -type f -name '*.webp' -print0 \
  | xargs -0 -P 16 -I{} bash -c '
      slug=$(basename "$1" .webp)
      wrangler r2 object put "qafiyah-assets/poets/${slug}/avatar.webp" \
        --file "$1" --content-type image/webp --remote
    ' _ {}
```

Two things that will bite you:

- **Cloudflare rate-limits this.** At 16-way parallelism, 224 of 6,631 uploads came back `429`.
  Collect the failures, then retry them at ~4-way with a short sleep and a couple of attempts
  each, that cleared all 224.
- **`wrangler r2 bucket info` lies right after a bulk upload.** Its `object_count` is a lagging
  billing/analytics stat and read `1` while thousands of objects were already live. Verify with
  real requests instead: `curl -sI https://cdn.qafiyah.com/poets/<slug>/avatar.webp` should give
  `200` and `content-type: image/webp`.

Set `poet.has_avatar` in Postgres for the poets you uploaded, that flag is what makes the web app
render the image.

## Split and encryption

`avatars.zip` over ~45MB is split into `avatars.zip.part-aa`, `.part-ab`, … with `scripts/db/split-dump.sh` (it isn't avatar-specific, it works on any file, just point it at `avatars.zip`), then each part is encrypted with the same recipe as DB dumps:

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "pass:<passphrase>" -in "$part" -out "$part.enc"
```

## Restore / decrypt

```bash
DIR=data/avatars/0000_19_09_2026   # or the newest snapshot
for f in "$DIR"/*.enc; do
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass pass:"<passphrase>" -in "$f" -out "${f%.enc}"
done
cat "$DIR"/avatars.zip.part-* > /tmp/avatars.zip
unzip /tmp/avatars.zip -d /tmp/avatars
```

## No automated tooling yet

Unlike `data/db/`, this directory has none of the DB-dump automation: no dedicated encrypt/resolve scripts, no `keys.manifest` entry, no `DUMP_KEY__*` `.env` variable, no restore-on-boot flow. Everything here was created manually. If avatar snapshots become a regular thing, generalize `scripts/db/encrypt-dump.sh` (its `*.dump`/`*.dump.part-*` file-matching pattern is the only part that's DB-specific) rather than writing new scripts from scratch.

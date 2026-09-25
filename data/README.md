# Data

Versioned binary snapshots, split by kind into subdirectories:

- `db/`: PostgreSQL dumps. Automated (`bun run db:*`, encrypted, self-seeding on `bun run dev`). See `db/README.md` and `db/MAINTAINERS_GUIDE.md`.
- `avatars/`: poet avatar image zips, mirrored in R2/`cdn.qafiyah.com` for serving. Manual today, same directory-naming and encryption pattern as `db/`. See `avatars/README.md`.

Both follow the same layout: `{category}/{sequence}_{DD}_{MM}_{YYYY}/`, encrypted `.enc` files committed, plaintext gitignored.

Everything in here is public and dedicated to the public domain under [CC0 1.0](LICENSE),
unlike the MIT-licensed code in the rest of the repo. The `.enc` files are encrypted, not
restricted. Why encrypt something that is open? Because a public
git history cannot be edited after the fact. Once a plaintext copy is pushed, every fork, clone,
and mirror keeps it for good, and nothing the maintainers do afterwards can take it back. If a
record ever has to come out, for whatever reason, it must be possible to remove it everywhere it
went. Encryption keeps that possible: the plaintext copies are the ones handed out on request, so
there is always a way to reach whoever holds one.

Getting a passphrase is quick. Email dumps@qafiyah.com for a `db/` snapshot or
avatars@qafiyah.com for an `avatars/` one, and say what you need it for, whether that is your own
use or a contribution you are planning. You get the passphrase right away. There is no vetting,
and nobody has to qualify. Each subdirectory's README says the same in full.

## Moving or renaming anything in here

Push that commit with `git -c pack.useSparse=false push`. Git's sparse pack algorithm (on by
default) re-packs every blob under a renamed path, so a directory rename in here builds a
multi-GB pack that GitHub rejects with `pack exceeds maximum allowed size (2.00 GiB)` even though
the real diff is a few KB (the `dumps/` to `data/db/` move produced a 2.6GB pack with sparse on
and 14KB with it off). Only the push carrying the rename is affected.

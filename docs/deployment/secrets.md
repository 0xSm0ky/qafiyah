# Secrets

Secrets are committed to git, encrypted with [SOPS](https://github.com/getsops/sops)
and [age](https://github.com/FiloSottile/age). `.env` is never edited by hand; it
is generated from the encrypted file.

| File                   | Who can decrypt      | Becomes                        |
| ---------------------- | -------------------- | ------------------------------ |
| `secrets/dev.enc.env`  | your laptop          | `.env` on your laptop          |
| `secrets/prod.enc.env` | your laptop, the VPS | `/opt/qafiyah/.env` on the VPS |

This page is for machines that hold an age key (the maintainers' laptops and the VPS). A contributor without one never runs `secrets:*`; for them `.env` is a plain hand-written file, see `docs/development.md`.

`.sops.yaml` lists the age **public** keys allowed to decrypt each file. Each
machine keeps its own **private** key at `~/.config/sops/age/keys.txt` (mode
`600`), and a private key never leaves the machine it was generated on, except
for the laptop key's backup in the password manager.

## Important

- **Back up the laptop private key.** Save the contents of
  `~/.config/sops/age/keys.txt` in the password manager. If that file is lost
  and no other recipient can decrypt, every committed secret is gone for good,
  including the `DUMP_KEY__*` passphrases that unlock `data/db/`.
- **Never deploy before production is migrated.** `bun run deploy` and
  `bun run db:reseed` fail on the VPS until it has `sops`, its own age key, and
  `secrets/prod.enc.env` exists on `origin/main`. Finish the one-time migration
  below first.
- **Never edit `.env` by hand**, on the laptop or on the VPS. The next
  `secrets:pull` or deploy overwrites it. Edit with `bun run secrets:edit`.
- **Never commit a decrypted file.** Only `secrets/*.enc.env` belongs in git.
- **A new variable goes in `scripts/secrets/schema.ts` first.** Any key not
  listed there is rejected, which is what catches typos.

## One-time production migration

Do these in order, and do not run `bun run deploy` until step 6.

1. **On the VPS**, install `sops` and `age` (release binaries) and generate the
   VPS key:

   ```bash
   mkdir -p ~/.config/sops/age && (umask 077 && age-keygen -o ~/.config/sops/age/keys.txt)
   ```

   Keep the printed `age1...` public key. The private key never leaves the VPS.

2. **On the laptop**, add that public key to the `secrets/prod\.enc\.env` rule in
   `.sops.yaml`, next to the laptop key (comma separated).

3. **Encrypt the current production `.env`** into `secrets/prod.enc.env`, and
   delete the plaintext copy right after:

   ```bash
   scp qafiyah:/opt/qafiyah/.env /tmp/prod.env
   sops encrypt --input-type dotenv --output-type dotenv \
     --filename-override secrets/prod.enc.env /tmp/prod.env > secrets/prod.enc.env
   rm -P /tmp/prod.env
   ```

4. **Run `bun run secrets:check prod`** and fix what it reports with
   `bun run secrets:edit prod`. Expect at least one finding: remove
   `INTERNAL_API_KEY`, which is now derived from `API_KEY_INTERNAL`.

5. **Check the VPS can decrypt it** before anything depends on it:

   ```bash
   scp secrets/prod.enc.env qafiyah:/tmp/prod.enc.env
   ssh qafiyah 'sops decrypt --input-type dotenv --output-type dotenv /tmp/prod.enc.env >/dev/null && echo ok; rm /tmp/prod.enc.env'
   ```

6. **Commit and push** `.sops.yaml`, `secrets/prod.enc.env`, and the scripts,
   then run `bun run deploy`. From then on `/opt/qafiyah/.env` is generated on
   every deploy.

## Daily use

```bash
bun run secrets:edit          # edit dev in $EDITOR, then regenerate .env
bun run secrets:edit prod     # edit prod, then commit and bun run deploy
bun run secrets:pull          # regenerate .env from secrets/dev.enc.env
bun run secrets:check         # validate both files against scripts/secrets/schema.ts
bun run dump:key:set          # writes DUMP_KEY__* into secrets/dev.enc.env
```

`bun run deploy` and `bun run db:reseed` run `scripts/secrets/pull.sh prod` on
the VPS right after checking out `origin/main`, so a committed change to
`secrets/prod.enc.env` reaches production on the next deploy.

## Validation

`scripts/secrets/schema.ts` is the single list of allowed keys. For each key it
says whether dev and prod require, allow, or forbid it, and what format the
value must have. `bun run secrets:check` enforces it:

- **Always, even without a key (CI):** no key set twice, no unknown key, no
  key forbidden in that environment, every required key present, and every
  value actually encrypted. Key names are plaintext in the encrypted file, so
  none of this needs decryption.
- **With an age key (laptop):** also value formats (64-char hex for generated
  keys, 16+ characters for prod passwords, `ENVIRONMENT` exactly `production`),
  credential pairs set together, the backup bucket never the public
  `qafiyah-assets`, and no two secrets holding the same value. Problems name
  the key and never print a value.

It runs after every `secrets:edit` (an invalid save reopens the editor), in
`dump:key:set`, before `secrets:pull` writes the dev `.env`, and in `bun run ci`,
which the pre-commit hook runs. The VPS does not run it, so it needs no Bun,
which is fine: only files that passed the local gate before merging reach
`origin/main`.

The apps check again at startup, so a hand-run `docker compose` with a broken
`.env` still fails closed: in production the API exits without
`API_KEY_INTERNAL` or `API_KEY_FULL`, and the web container exits without
`INTERNAL_API_KEY` or `SESSION_STATE_SECRET`.

## Setting up a machine

Install the tools and generate the machine's key:

```bash
brew install sops age                     # macOS; on the VPS use the release binaries
mkdir -p ~/.config/sops/age
(umask 077 && age-keygen -o ~/.config/sops/age/keys.txt)
```

`age-keygen` prints the public key (`age1...`). On a machine that can already
decrypt, add it to the right rules in `.sops.yaml`, then re-wrap the files and
commit:

```bash
sops updatekeys secrets/prod.enc.env
sops updatekeys secrets/dev.enc.env
```

A machine cannot grant itself access; an existing recipient has to run
`updatekeys`.

## Losing or revoking a key

- **Laptop key lost:** restore `~/.config/sops/age/keys.txt` from the password
  manager. Without that backup and without the VPS key, every committed secret
  is unrecoverable.
- **Machine compromised:** remove its public key from `.sops.yaml`, run
  `sops updatekeys`, and **rotate the secrets themselves**. Removing a recipient
  does not undo what it already decrypted, and the old ciphertext stays in git
  history.

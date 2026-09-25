# Contributing

## Reporting bugs

Open a [GitHub issue](https://github.com/raaqimorg/qafiyah/issues) with steps to reproduce. For
security vulnerabilities, see [SECURITY.md](SECURITY.md) instead.

## Making changes

1. Fork the repo and create a branch off `main`.
2. Follow the conventions in `docs/`: [`code-conventions.md`](../docs/code-conventions.md),
   [`typescript-conventions.md`](../docs/typescript-conventions.md),
   [`rust-conventions.md`](../docs/rust-conventions.md), and
   [`testing.md`](../docs/testing.md).
3. Set up the repo and run it locally as described in [`docs/development.md`](../docs/development.md).
4. Run `bun run ci` before opening a PR. It is the full gate; GitHub Actions runs all of it except the Docker phases on every push and PR.
5. Follow [`pull-requests.md`](../docs/pull-requests.md) for commit message and PR conventions.
6. `README.md`'s "Documentation map" lists where everything is documented; update the doc that describes what you changed.

## Keeping your email private

Every commit carries an author email, and pushing publishes it. To make sure this clone only ever commits with the address you meant, for example a GitHub no-reply address rather than a personal or work one:

1. Set that address for this clone only: `git config --local user.email <address>`.
2. Turn on the guard: `git config --local qafiyah.allowedEmail "$(git config --local user.email)"`. The git hooks then refuse any commit, and any push, whose author, committer, or `Co-authored-by:` line uses a different address, including one an AI agent or a script sets. The address stays in `.git/config` and is never committed.
3. On GitHub, under Settings, then Emails, turn on "Keep my email addresses private" and "Block command line pushes that expose my email", so GitHub also rejects them on push.

Details and limits: [`docs/development.md`](../docs/development.md) ("Committing").

By contributing, you agree that your code and documentation contributions will be licensed under
the project's [MIT license](../LICENSE), and that your data contributions (poems, poets, and
corrections to them) will be dedicated to the public domain under [CC0 1.0](../data/LICENSE).

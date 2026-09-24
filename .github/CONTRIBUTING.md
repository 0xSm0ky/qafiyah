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
4. Run `bun run ci` before opening a PR. It is the full gate; GitHub Actions runs only a fast subset of it.
5. Follow [`pull-requests.md`](../docs/pull-requests.md) for commit message and PR conventions.
6. `README.md`'s "Documentation map" lists where everything is documented; update the doc that describes what you changed.

By contributing, you agree that your contributions will be licensed under the project's
[MIT license](../LICENSE).

# Search Indexer Agent Guide

Rust binary that builds the Elasticsearch indices `apps/api` searches. It reads poems and poets from Postgres, maps each row to a document, bulk-writes into a fresh versioned index (`poems_v<N>`, `poets_v<N>`), and swaps the `poems`/`poets` alias onto it. The API only ever queries the alias, so a reindex is invisible to it. What the documents contain and why (tashkeel stripping, `*Display` fields, `nameSort`) is explained in `docs/search.md`; the mappings and analyzers live in `crates/elasticsearch/schema.json`.

## Shape

- `main.rs`: reads the environment, then `bootstrap`: provisions the read-only Elasticsearch user the API connects as, skips the rebuild when both aliases already hold documents (unless forced), otherwise runs `reindex` for poems and then poets, then exits 0.
- `pg.rs`: the two `SELECT`s and the batched streaming reads. Poem content arrives as hemistichs joined by `*`.
- `docs.rs`: row to document mapping (`to_poem_doc`, `to_poet_doc`).
- `arabic.rs`: tashkeel stripping and the sort folding derived from the schema's char filter. `arabic-text.vectors.json` is the fixture the `matches_the_shared_vectors` test pins this crate's output to.
- `es.rs`: the Elasticsearch calls (create index, bulk, refresh-interval toggling, alias swap, `next_index_name` for the `_v<N>` counter).
- `log.rs`: one-line structured log output.

## Environment

| Variable               | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | Postgres, the read-only `qafiyah_api` role                       |
| `ELASTICSEARCH_URL`    | Elasticsearch as the `elastic` superuser (it creates the reader) |
| `ES_READER_PASSWORD`   | password to set on the read-only Elasticsearch user              |
| `SEARCH_INDEXER_FORCE` | `true` rebuilds even when the aliases already hold documents     |

## Deliberate, non-obvious behavior

See the Search indexer section of `docs/exceptions.md`.

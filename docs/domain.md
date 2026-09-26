# Domain Model

What a poem, poet, meter, rhyme, era, theme, and collection actually mean in Qafiyah, for a
contributor who doesn't already know classical Arabic prosody. This is conceptual, not
implementation detail, for the schema/module internals see `apps/api/AGENTS.md` and
`apps/web/AGENTS.md`.

## Poem

The core content entity: `title`, `slug` (four mixed-case letters, e.g. `TnKK`), `verses`
(ordered pairs of hemistichs), `verse_count`, a `sample` (first three hemistichs, used for
previews), and `keywords`.
It does **not** have its own era, era is a property of the poet, not the poem (see Era below).
Every poem has exactly one poet, meter, theme, rhyme, and poem type; collection, form,
register, genre, and rhyme majra are optional (see Poem type below).

Raw poem content is stored with `*` as the hemistich delimiter and split into hemistichs, then
paired into verses (`apps/api/src/domain/poems.rs`, `parse_poem_content`).

For a عمودي poem the `title` is its first hemistich, with diacritics, tatweel, punctuation, digits
and non-standard letter forms deleted (deleted, not replaced by a space) and whitespace collapsed.
This is a data invariant maintained when dumps are produced, not something the application
enforces at read time.

## Verse and hemistich

Not database entities, a structural detail of how a poem's content is shaped. A **verse** (بيت,
the classical Arabic couplet/line) is a pair of **hemistichs** (شطر, half-lines): the first
hemistich sets up the line, the second completes it, and the two together carry one metrical
unit. A poem's `verses` field is an ordered list of these pairs.

There is no separate "fragment" entity, that word shows up in the codebase only for the
random-poem share excerpt: one verse plus the poet's name, capped at a max length for social
sharing (`build_excerpt`, `apps/api/src/domain/poems.rs`). "Rejects a fragment with fewer than
two hemistichs" just means a shareable excerpt needs a complete verse, not half of one.

## Poem type (نوع القصيدة, poem_type)

The poem's **form**: how its lines are built, as opposed to what it is about (Theme) or
which pattern it scans to (Meter). `poems.poem_type_id` is NOT NULL, one of five:

| slug         | Arabic | what it is                                                                                                                                                   |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `amudi`      | عمودي  | classical verse. Every line is a bayt of two hemistichs, one bahr and one rawi throughout. The overwhelming majority of the catalog.                         |
| `hurr`       | حر     | free verse (شعر التفعيلة) and prose poetry. Lines of uneven length, no single rhyme.                                                                         |
| `muwashshah` | موشح   | the Andalusi strophic form. Regular line lengths, but the rhyme deliberately changes between strophes, which is exactly what distinguishes it from a qasida. |
| `muzdawij`   | مزدوج  | couplet form, usually rajaz, where the two hemistichs of each bayt rhyme with each other and the rhyme changes from bayt to bayt.                            |
| `majhul`     | مجهول  | unknown, see "The unknown value" below.                                                                                                                      |

Distinguishing these is structural, not editorial: a qasida holds one bahr, so its hemistich
lengths cluster tightly, and one rawi, so every ajuz ends on the same rhyme consonant. A
muwashshah has the first property but not the second. A muzdawij has both, which is why
length and rhyme alone cannot separate it from a qasida.

`poem_type` has no listing page or counts, but the poem detail endpoint returns it as
`poemType` (`{ name, slug }`), and the web poem page reads it for layout: an `amudi` poem
renders each bayt as two staggered lines, sadr against the right and ajuz against the left
of a column sized in `em`, while every other type stays centered with its hemistichs stacked.

### Schema-only attributes

These poem columns are read by nothing in `apps/api`, `apps/web`, or `apps/search-indexer`,
unlike meter, rhyme, theme, era, and collection, which all have their own pages and counts.
All are nullable:

- `form_id` (`forms`): `qasida` قصيدة, `muqattaa` مقطعة, `abyatthaniya` ابيات ثانية, `baytmufrad` بيت مفرد, `shatrbayt` شطر بيت. How much of a poem survives, a full ode down to a single half-line.
- `register_id` (`registers`): `fasih` فصيح, `nabati` نبطي, `hadith` حديث.
- `genre_id` (`genres`): `shir` شعر, `khatira` خاطرة.
- `rhyme_majra_id` (`majras`): the vowel carried by the rawi, `fatha` فتحة, `damma` ضمة, `kasra` كسرة, their tanwin forms, and `sukun` سكون.

Changing any of these therefore has no user-visible effect on the site today, and needs no
reindex. Treat that as a fact about the current application surface, not a promise.

## Poet

`name`, `slug`, an optional `nickname` and `bio`, one `era`, a precomputed `poems_count`, and
`has_avatar` (whether an image exists for them, served from R2, see `data/avatars/README.md`). A
poet has exactly one era; poems don't carry era independently.

`nickname` holds whatever a poet is otherwise known by, a kunya (أبو سعيد), a laqab (سراج الهند),
or a shuhra (الحياوي), with no column distinguishing which. Roughly a fifth of poets have one.
A nickname that repeats the `name` outright carries no information and is stored as NULL; a
nickname that is a _substring_ of the name (الحياوي for
عبد الحسين الحياوي, about 1,353 poets) is still stored, and the web app renders a nickname only
when it is not contained in the name (`pickAdditiveNickname`,
`apps/web/src/lib/seo/poets-page.ts`).

## Meter (بحر, bahr)

The metrical pattern a poem is composed in (classical Arabic poetry is quantitative, built from
fixed syllable-weight patterns), e.g. slug `altawil` for الطويل. Poem- and poet-facing (a meter
page shows both counts): `apps/api/src/domain/taxonomy.rs`.

## Rhyme (قافية, qafiyah)

Classified by the **rhyme letter** (حرف الروي), the consonant every verse in the poem ends on,
e.g. slug `meem` for م. The catalog's rhyme taxonomy spans the Arabic alphabet end to end
(rhyme pages are ordered `id`, roughly hamza to ya). This is also where the project's name comes
from, قافية (qafiyah) is the Arabic word for a poem's rhyme.

## Era (عصر, asr)

A chronological period (e.g. pre-Islamic/جاهلي, Islamic, Umayyad, Abbasid, ...). Eras have a
`sort_order`, so era listings render in actual chronological sequence, not alphabetically. Era
is a **poet**-level attribute: every poem inherits its era through its poet, there's no
poem-level era column.

## Theme (غرض, gharad)

The poem's genre or purpose, e.g. `alnasib` (النسيب), the amatory-prelude genre classical Arabic
poems often open with. Poem-level only, poets don't have a theme.

## Collection (ديوان, diwan)

A published, curated anthology a poem belongs to, a diwan or one of the classical foundational
compilations (`apps/web/src/lib/seo/taxonomy-copy.ts` describes this taxonomy as "دواوين وأمهات
الكتب", diwans and foundational anthologies). Poem-level only, like theme.

## The "unknown" value

Every taxonomy (poet, meter, era, theme, rhyme, collection) has a real row for **unknown**
(`غير معروف`), not a nullable foreign key. A poem or poet lands there when the classical sourcing
doesn't record that attribute.

The slug is `ghayrmaruf` for every taxonomy _except poets_, whose slugs are always four random
letters: the unknown poet is `غير معروف` / `JJHE`, so match it on `name`, never on slug
(`UNKNOWN_ENTITY_NAME`, `apps/web/src/lib/seo/meta-text.ts`). A `poets.slug = 'ghayrmaruf'`
test silently matches nothing.

Poem type spells its unknown differently, `majhul` (مجهول), and it carries a second meaning
as well. A poem is `majhul` either because the sourcing never said what form it was, or
because a structural validation pass could not verify the form it claimed. The second case
means "not verified", never "verified as something else": a poem that fails validation is
demoted to `majhul`, never to `hurr`, and a poem too short or too irregular to test keeps
whatever label it already had rather than being demoted on absent evidence. So `majhul` is
a statement about what is known, not a claim that the poem is formless. It behaves like any other taxonomy value (it
has its own listing page, its own count), but the web app deliberately filters it out of "top N"
attribution lists and picks the first _attributed_ poem when it needs a representative sample,
so an unattributed poet's name never gets showcased as if it were a real byline
(`apps/web/src/lib/seo/taxonomy-copy.ts`, `apps/web/src/lib/seo/meta-text.ts`).

## Related poems

Each poem has a precomputed list of up to 10 related poems (`poem_relations` table: `poem_id`,
`related_id`, `rank`), refreshed by `refresh_poem_relations()` before every DB dump snapshot, see
`data/db/MAINTAINERS_GUIDE.md`.

A poem whose era or poet is unknown is never _suggested_: the generator draws its candidates from
a pool that excludes them (`tmp_pool` in `scripts/db/sql/refresh-poem-relations.sql`). Such a poem
still _gets_ a list of its own, just a shorter one, since its poet and era buckets contribute
nothing.

## Taxonomy counts

The `*_stats` relations (`poet_stats`, `meter_stats`, `rhyme_stats`, `era_stats`, `theme_stats`,
`collection_stats`, and the schema-only `poem_type_stats`, `form_stats`, `register_stats`,
`genre_stats`, `majra_stats`, `nation_stats`, `gender_stats`) hold the per-term poem and poet
counts the listing pages render. They are **tables**, not views: as views they re-aggregated the
whole `poems` table on every request (hundreds of milliseconds per taxonomy index page). They are
rebuilt by `refresh_taxonomy_stats()` (`scripts/db/sql/refresh-taxonomy-stats.sql`, ~3s for the
full corpus), which runs alongside `refresh_poem_relations()` before every dump and again on
restore in `scripts/db/init.sh`. Anything that changes a poem's or poet's taxonomy assignment
leaves them stale until that runs. `GET /v1/poems` also reads its total from them when the filter
is a single term (one value of one facet), so a stale table skews that list's pagination too.

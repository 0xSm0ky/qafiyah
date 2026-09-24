use axum::extract::{Extension, RawQuery, State};
use axum::http::{HeaderValue, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use rand::RngExt;

use crate::constants::{
    MAX_FILTER_SLUGS, NO_STORE_CACHE_CONTROL, POEMS_PER_PAGE, SITEMAP_POEMS_PER_SHARD,
};
use crate::domain::poems::{self, Facets, PoemDetail, PoemListItem, RandomPoemOption, Total};
use crate::envelope::{ItemEnvelope, ListEnvelope, build_pagination};
use crate::error::AppError;
use crate::extract::SafePath;
use crate::log::LogHandle;
use crate::openapi::{
    FilteredListErrors, FourLetterSlug, ListErrors, LookupErrors, TransliteratedSlug,
};
use crate::query::Query;
use crate::slug;
use crate::state::AppState;

fn facets(query: &Query) -> Result<Facets, AppError> {
    Ok(Facets {
        poet: query.facet("poet", slug::four_letters, MAX_FILTER_SLUGS)?,
        era: query.facet("era", slug::transliterated, MAX_FILTER_SLUGS)?,
        theme: query.facet("theme", slug::transliterated, MAX_FILTER_SLUGS)?,
        meter: query.facet("meter", slug::transliterated, MAX_FILTER_SLUGS)?,
        rhyme: query.facet("rhyme", slug::transliterated, MAX_FILTER_SLUGS)?,
        collection: query.facet("collection", slug::transliterated, MAX_FILTER_SLUGS)?,
    })
}

#[utoipa::path(
    get,
    path = "/poems",
    tag = "poems",
    operation_id = "poems.list",
    description = "Paginated list of poems with optional multi-select facet filters (poet, era, theme, meter, rhyme, collection). Facets combine conjunctively; repeating a single facet ORs its values.",
    params(
        ("page" = Option<String>, Query, description = "Page number as a 1-based integer string. Minimum 1.", pattern = "^[1-9][0-9]*$", example = "1"),
        ("poet" = Option<Vec<FourLetterSlug>>, Query, description = "Filter by poet slug. Repeatable array param, e.g. ?poet=yoFB. Values are `slug` from GET /poets.", example = json!(["yoFB"])),
        ("era" = Option<Vec<TransliteratedSlug>>, Query, description = "Filter by era slug. Repeatable array param, e.g. ?era=abbasi. Values are `slug` from GET /eras.", example = json!(["abbasi"])),
        ("theme" = Option<Vec<TransliteratedSlug>>, Query, description = "Filter by theme slug. Repeatable array param, e.g. ?theme=alnasib. Values are `slug` from GET /themes.", example = json!(["alnasib"])),
        ("meter" = Option<Vec<TransliteratedSlug>>, Query, description = "Filter by meter slug. Repeatable array param, e.g. ?meter=altawil. Values are `slug` from GET /meters.", example = json!(["altawil"])),
        ("rhyme" = Option<Vec<TransliteratedSlug>>, Query, description = "Filter by rhyme slug. Repeatable array param, e.g. ?rhyme=meem. Values are `slug` from GET /rhymes.", example = json!(["meem"])),
        ("collection" = Option<Vec<TransliteratedSlug>>, Query, description = "Filter by collection slug. Repeatable array param, e.g. ?collection=almuallaqat. Values are `slug` from GET /collections.", example = json!(["almuallaqat"])),
    ),
    responses(
        (status = 200, description = "A page of poems with pagination metadata.", body = ListEnvelope<PoemListItem>),
        FilteredListErrors,
    ),
)]
pub(crate) async fn list(
    State(state): State<AppState>,
    Extension(log): Extension<LogHandle>,
    RawQuery(raw): RawQuery,
) -> Result<Json<ListEnvelope<PoemListItem>>, AppError> {
    let query = Query::parse(raw.as_deref());
    let page = query.unbounded_page()?;
    let facets = facets(&query)?;
    let (data, total) = poems::list(&state.pg, &facets, page, POEMS_PER_PAGE).await?;
    let envelope = ListEnvelope {
        data,
        pagination: build_pagination(page, POEMS_PER_PAGE, total.cast_unsigned()),
    };
    log.set("result_count", total);
    log.set("page", page);
    log.set("page_size", POEMS_PER_PAGE);
    log.set("total_pages", envelope.pagination.total_pages);
    Ok(Json(envelope))
}

#[utoipa::path(
    get,
    path = "/poems/slugs",
    tag = "poems",
    operation_id = "poems.listSlugs",
    description = "Paginated stream of poem slugs only, intended for sitemap generation and incremental crawling.",
    params(
        ("page" = Option<String>, Query, description = "Page number as a 1-based integer string. Minimum 1.", pattern = "^[1-9][0-9]*$", example = "1"),
    ),
    responses(
        (status = 200, description = "A page of poem slugs.", body = ListEnvelope<FourLetterSlug>),
        FilteredListErrors,
    ),
)]
pub(crate) async fn list_slugs(
    State(state): State<AppState>,
    Extension(log): Extension<LogHandle>,
    RawQuery(raw): RawQuery,
) -> Result<Json<ListEnvelope<String>>, AppError> {
    let page = Query::parse(raw.as_deref()).unbounded_page()?;
    let (data, total) = tokio::try_join!(
        poems::list_slugs(&state.pg, page, SITEMAP_POEMS_PER_SHARD),
        poems::count(&state.pg)
    )?;
    log.set(
        "result_count",
        u64::try_from(data.len()).unwrap_or(u64::MAX),
    );
    log.set("page", page);
    let envelope = ListEnvelope {
        data,
        pagination: build_pagination(page, SITEMAP_POEMS_PER_SHARD, total.cast_unsigned()),
    };
    Ok(Json(envelope))
}

#[utoipa::path(
    get,
    path = "/poems/count",
    tag = "poems",
    operation_id = "poems.count",
    description = "Total number of poems in the catalog.",
    responses(
        (status = 200, description = "The total poem count.", body = ItemEnvelope<Total>),
        ListErrors,
    ),
)]
pub(crate) async fn count(
    State(state): State<AppState>,
    Extension(log): Extension<LogHandle>,
) -> Result<Json<ItemEnvelope<Total>>, AppError> {
    let total = poems::count(&state.pg).await?;
    log.set("result_count", total);
    Ok(Json(ItemEnvelope {
        data: Total { total },
    }))
}

#[utoipa::path(
    get,
    path = "/poems/{slug}",
    tag = "poems",
    operation_id = "poems.get",
    description = "Full poem detail by slug, including verses, prosody metadata, and related poems.",
    params(
        ("slug" = String, Path, description = "Resource identifier taken from the `slug` field of the matching list endpoint.", pattern = "^[a-zA-Z]{4}$", example = "TnKK"),
    ),
    responses(
        (status = 200, description = "The requested poem.", body = ItemEnvelope<PoemDetail>),
        LookupErrors,
    ),
)]
pub(crate) async fn detail(
    State(state): State<AppState>,
    Extension(log): Extension<LogHandle>,
    SafePath(raw): SafePath<String>,
) -> Result<Json<ItemEnvelope<PoemDetail>>, AppError> {
    let slug = slug::four_letters(&raw)?;
    let poem = poems::get(&state.pg, slug).await?;
    log.set("poem_id", slug);
    log.set("poet_id", poem.poet.slug.clone());
    log.set("era", poem.era.slug.clone());
    log.set("meter", poem.meter.slug.clone());
    log.set("theme", poem.theme.slug.clone());
    Ok(Json(ItemEnvelope { data: poem }))
}

async fn random(
    State(state): State<AppState>,
    RawQuery(raw): RawQuery,
) -> Result<Response, AppError> {
    let option = RandomPoemOption::parse(Query::parse(raw.as_deref()).first("option").as_deref())?;
    let roll: f64 = rand::rng().random();
    let body = poems::random(&state.pg, &option, roll).await?;
    Ok((
        [
            (
                header::CONTENT_TYPE,
                HeaderValue::from_static("text/plain; charset=UTF-8"),
            ),
            (
                header::CACHE_CONTROL,
                HeaderValue::from_static(NO_STORE_CACHE_CONTROL),
            ),
        ],
        body,
    )
        .into_response())
}

pub fn uncached_router() -> Router<AppState> {
    Router::new().route("/poems/random", get(random))
}

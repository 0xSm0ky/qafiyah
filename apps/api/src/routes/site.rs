use axum::Router;
use axum::http::{HeaderValue, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;

use crate::constants::{
    API_DOCS_PATH, API_V1_PREFIX, FAVICON_CACHE_CONTROL, FAVICON_EMOJI, LLMS_CACHE_CONTROL,
    NO_STORE_CACHE_CONTROL, PROD_API_URL, PROD_SITE_URL, ROBOTS_CACHE_CONTROL,
    SECURITY_CACHE_CONTROL, SECURITY_EMAIL, SITE_NAME_EN,
};
use crate::routes::redirect;
use crate::state::AppState;

fn text_response(
    body: String,
    content_type: &'static str,
    cache_control: &'static str,
) -> Response {
    (
        [
            (header::CONTENT_TYPE, HeaderValue::from_static(content_type)),
            (
                header::CACHE_CONTROL,
                HeaderValue::from_static(cache_control),
            ),
        ],
        body,
    )
        .into_response()
}

pub fn docs_redirect() -> Response {
    redirect(API_DOCS_PATH, None)
}

const PLAIN_TEXT: &str = "text/plain; charset=utf-8";

fn llms() -> Response {
    let base = format!("{PROD_API_URL}{API_V1_PREFIX}");
    let body = LLMS_TEMPLATE
        .replace("{NAME}", SITE_NAME_EN)
        .replace("{BASE}", &base)
        .replace("{SITE}", PROD_SITE_URL);
    text_response(body, PLAIN_TEXT, LLMS_CACHE_CONTROL)
}

fn robots() -> Response {
    let body = ROBOTS_TEMPLATE
        .replace("{NAME}", SITE_NAME_EN)
        .replace("{API}", PROD_API_URL)
        .replace("{SITE}", PROD_SITE_URL);
    text_response(body, PLAIN_TEXT, ROBOTS_CACHE_CONTROL)
}

fn security_txt() -> Response {
    let body = SECURITY_TEMPLATE
        .replace("{EMAIL}", SECURITY_EMAIL)
        .replace("{SITE}", PROD_SITE_URL)
        .replace("{API}", PROD_API_URL);
    text_response(body, PLAIN_TEXT, SECURITY_CACHE_CONTROL)
}

fn healthz() -> Response {
    text_response("ok".to_string(), PLAIN_TEXT, NO_STORE_CACHE_CONTROL)
}

fn favicon() -> Response {
    let body = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" x="-0.1em" font-size="90">{FAVICON_EMOJI}</text></svg>"#
    );
    text_response(body, "image/svg+xml", FAVICON_CACHE_CONTROL)
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(|| async { docs_redirect() }))
        .route("/healthz", get(|| async { healthz() }))
        .route("/llms.txt", get(|| async { llms() }))
        .route("/robots.txt", get(|| async { robots() }))
        .route(
            "/.well-known/security.txt",
            get(|| async { security_txt() }),
        )
        .route("/favicon.ico", get(|| async { favicon() }))
}

const LLMS_TEMPLATE: &str = include_str!("../../../../well-known/llms.api.md");
const ROBOTS_TEMPLATE: &str = include_str!("../../../../well-known/robots.api.txt");
const SECURITY_TEMPLATE: &str = include_str!("../../../../well-known/security.txt");

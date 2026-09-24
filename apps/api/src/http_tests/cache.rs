use axum::body::Body;
use axum::http::{Request, StatusCode};

use crate::constants::READ_CACHE_CONTROL;
use crate::http_tests::{app_with, empty_hits};
use crate::test_support::{FakeEs, request, send};

fn conditional(validator: &str) -> Request<Body> {
    Request::builder()
        .uri("/v1/openapi.json")
        .header("if-none-match", validator)
        .body(Body::empty())
        .expect("a request")
}

#[tokio::test]
async fn a_json_success_is_stamped_with_a_weak_etag_and_the_read_policy() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let sent = send(app_with(&es), request("GET", "/v1/openapi.json")).await;
    assert_eq!(sent.status, StatusCode::OK);
    assert!(sent.header("etag").expect("an etag").starts_with("W/\""));
    assert_eq!(sent.header("cache-control"), Some(READ_CACHE_CONTROL));
}

#[tokio::test]
async fn a_json_success_is_cacheable_only_by_the_callers_own_browser() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let sent = send(app_with(&es), request("GET", "/v1/openapi.json")).await;
    assert_eq!(
        sent.header("cache-control"),
        Some("private, max-age=300, stale-while-revalidate=86400")
    );
}

#[tokio::test]
async fn a_matching_validator_yields_not_modified_with_no_body() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let first = send(app_with(&es), request("GET", "/v1/openapi.json")).await;
    let etag = first.header("etag").expect("an etag").to_string();
    for validator in [
        etag.clone(),
        etag.trim_start_matches("W/").to_string(),
        "*".to_string(),
        format!("\"x\", {etag}"),
    ] {
        let sent = send(app_with(&es), conditional(&validator)).await;
        assert_eq!(sent.status, StatusCode::NOT_MODIFIED, "{validator}");
        assert!(sent.body.is_empty(), "{validator}");
        assert_eq!(sent.header("etag"), Some(etag.as_str()));
        assert_eq!(sent.header("cache-control"), Some(READ_CACHE_CONTROL));
        assert!(sent.header("content-type").is_none(), "{validator}");
    }
}

#[tokio::test]
async fn a_not_modified_response_keeps_only_the_validator_headers_plus_outer_layers() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let first = send(app_with(&es), request("GET", "/v1/openapi.json")).await;
    let etag = first.header("etag").expect("an etag").to_string();
    let request = Request::builder()
        .uri("/v1/openapi.json")
        .header("if-none-match", etag)
        .header("cf-connecting-ip", "203.0.113.9")
        .body(Body::empty())
        .expect("a request");
    let sent = send(app_with(&es), request).await;
    assert_eq!(sent.status, StatusCode::NOT_MODIFIED);
    assert!(sent.header("x-ratelimit-limit").is_some());
    assert_eq!(sent.header("access-control-allow-origin"), Some("*"));
    assert!(sent.header("content-length").is_none() || sent.header("content-length") == Some("0"));
}

#[tokio::test]
async fn a_stale_validator_returns_the_full_body() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let sent = send(app_with(&es), conditional("W/\"0000000000000000\"")).await;
    assert_eq!(sent.status, StatusCode::OK);
    assert!(!sent.body.is_empty());
}

#[tokio::test]
async fn errors_and_non_json_bodies_are_never_stamped() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let error = send(app_with(&es), request("GET", "/v1/poems/abc")).await;
    assert!(error.header("etag").is_none());
    assert_eq!(error.header("cache-control"), Some("no-store"));
    let html = send(app_with(&es), request("GET", "/v1/docs")).await;
    assert!(html.header("etag").is_none());
    assert!(html.header("cache-control").is_none());
}

#[tokio::test]
async fn the_random_poem_and_go_routes_are_outside_the_cache_layer() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    let go = send(app_with(&es), request("GET", "/v1/go/x")).await;
    assert!(go.header("etag").is_none());
    let random = send(app_with(&es), request("GET", "/v1/poems/random")).await;
    assert!(random.header("etag").is_none());
    assert_eq!(random.header("cache-control"), Some("no-store"));
}

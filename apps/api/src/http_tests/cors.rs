use axum::http::StatusCode;

use crate::http_tests::{app_with, empty_hits};
use crate::test_support::{FakeEs, request, send};

#[tokio::test]
async fn any_options_request_is_answered_by_the_preflight_before_routing() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    for path in [
        "/v1/search",
        "/v1/nope",
        "/account/users/1/keys",
        "/healthz",
        "/",
    ] {
        let sent = send(app_with(&es), request("OPTIONS", path)).await;
        assert_eq!(sent.status, StatusCode::NO_CONTENT, "{path}");
        assert_eq!(sent.header("access-control-allow-origin"), Some("*"));
        assert_eq!(
            sent.header("access-control-allow-methods"),
            Some("GET,HEAD,OPTIONS")
        );
        assert_eq!(
            sent.header("access-control-allow-headers"),
            Some("x-api-key")
        );
        assert_eq!(sent.header("access-control-max-age"), Some("600"));
        assert_eq!(sent.header("vary"), Some("Access-Control-Request-Headers"));
        assert!(sent.body.is_empty());
    }
}

#[tokio::test]
async fn every_response_exposes_the_ratelimit_headers_to_browsers() {
    let es = FakeEs::serving(StatusCode::OK, empty_hits()).await;
    for path in ["/v1/openapi.json", "/v1/poems/abc", "/nope", "/healthz"] {
        let sent = send(app_with(&es), request("GET", path)).await;
        assert_eq!(
            sent.header("access-control-allow-origin"),
            Some("*"),
            "{path}"
        );
        assert_eq!(
            sent.header("access-control-expose-headers"),
            Some(
                "Content-Type,ETag,x-ratelimit-limit,x-ratelimit-remaining,x-ratelimit-reset,retry-after"
            ),
            "{path}"
        );
    }
}

pub mod account;
pub mod go;
pub mod poems;
pub mod poets;
pub mod search;
pub mod site;
pub mod spec;
pub mod taxonomy;

use axum::body::Body;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::Response;

const REDIRECT_STATUS: StatusCode = StatusCode::FOUND;

#[expect(
    clippy::expect_used,
    reason = "a redirect with no body is always valid"
)]
pub(crate) fn redirect(location: &str, cache_control: Option<&'static str>) -> Response {
    let mut response = Response::builder()
        .status(REDIRECT_STATUS)
        .body(Body::empty())
        .expect("a redirect with no body is always valid");
    if let Ok(value) = HeaderValue::from_str(location) {
        response.headers_mut().insert(header::LOCATION, value);
    }
    if let Some(cache_control) = cache_control {
        response.headers_mut().insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static(cache_control),
        );
    }
    response
}

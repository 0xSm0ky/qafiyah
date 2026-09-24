use axum::body::Body;
use axum::extract::Request;
use axum::http::{HeaderValue, Method, StatusCode, header};
use axum::middleware::Next;
use axum::response::Response;

const ALLOW_ORIGIN: &str = "*";
const EXPOSE_HEADERS: &str =
    "Content-Type,ETag,x-ratelimit-limit,x-ratelimit-remaining,x-ratelimit-reset,retry-after";
const ALLOW_METHODS: &str = "GET,HEAD,OPTIONS";
const ALLOW_HEADERS: &str = "x-api-key";
const MAX_AGE: &str = "600";
const VARY: &str = "Access-Control-Request-Headers";

fn set(response: &mut Response, name: header::HeaderName, value: &'static str) {
    response
        .headers_mut()
        .insert(name, HeaderValue::from_static(value));
}

fn preflight() -> Response {
    let mut response = Response::new(Body::empty());
    *response.status_mut() = StatusCode::NO_CONTENT;
    set(
        &mut response,
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        ALLOW_ORIGIN,
    );
    set(
        &mut response,
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        EXPOSE_HEADERS,
    );
    set(&mut response, header::ACCESS_CONTROL_MAX_AGE, MAX_AGE);
    set(
        &mut response,
        header::ACCESS_CONTROL_ALLOW_METHODS,
        ALLOW_METHODS,
    );
    set(
        &mut response,
        header::ACCESS_CONTROL_ALLOW_HEADERS,
        ALLOW_HEADERS,
    );
    set(&mut response, header::VARY, VARY);
    response
}

pub async fn layer(request: Request, next: Next) -> Response {
    if request.method() == Method::OPTIONS {
        return preflight();
    }
    let mut response = next.run(request).await;
    set(
        &mut response,
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        ALLOW_ORIGIN,
    );
    set(
        &mut response,
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        EXPOSE_HEADERS,
    );
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preflight_advertises_the_api_key_header() {
        let response = preflight();
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
        assert_eq!(
            response.headers().get(header::ACCESS_CONTROL_ALLOW_HEADERS),
            Some(&HeaderValue::from_static("x-api-key"))
        );
    }
}

use std::sync::OnceLock;

use axum::Router;
use axum::http::{HeaderValue, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;

use crate::state::AppState;

#[expect(
    clippy::expect_used,
    reason = "a built document is always serializable"
)]
fn serialized() -> &'static str {
    static DOCUMENT: OnceLock<String> = OnceLock::new();
    DOCUMENT.get_or_init(|| {
        serde_json::to_string(&crate::document()).expect("a built document is always serializable")
    })
}

async fn document() -> Response {
    (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/json"),
        )],
        serialized(),
    )
        .into_response()
}

const REFERENCE_HTML: &str = r#"<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.68.0"
            integrity="sha384-ayGz8N+NChlUEfR0zr5Zy3T6Q4lhcdiASJNoshS6+vxV56ZE300qfWNBjj9pqsLN"
            crossorigin="anonymous"></script>
    <script>
      Scalar.createApiReference('#app', { url: '/v1/openapi.json', withDefaultFonts: false })
    </script>
  </body>
</html>
"#;

async fn reference() -> Response {
    (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/html;charset=utf-8"),
        )],
        REFERENCE_HTML,
    )
        .into_response()
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/openapi.json", get(document))
        .route("/docs", get(reference))
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use super::*;
    use crate::constants::API_V1_PREFIX;

    #[test]
    fn serves_the_document_the_handlers_declare() {
        let served: Value = serde_json::from_str(serialized()).expect("valid json");
        let generated = serde_json::to_value(crate::document()).expect("serializable");
        assert_eq!(served, generated);
    }

    #[test]
    fn the_server_url_is_relative_to_wherever_the_document_is_served() {
        let spec: Value = serde_json::from_str(serialized()).expect("valid json");
        assert_eq!(spec["servers"][0]["url"], API_V1_PREFIX);
        assert!(spec["paths"]["/meters"].is_object());
    }
}

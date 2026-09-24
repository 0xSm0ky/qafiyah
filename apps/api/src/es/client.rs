use std::time::Duration;

use qafiyah_elasticsearch::Endpoint;
use reqwest::Method;
use serde_json::Value;

use crate::constants::ES_SEARCH_TIMEOUT_SECONDS;
use crate::error::AppError;

pub struct Es {
    endpoint: Endpoint,
    timeout: Duration,
    pub poems_alias: String,
    pub poets_alias: String,
}

impl Es {
    pub fn new(url: &str) -> Result<Self, String> {
        Self::with_timeout(url, Duration::from_secs(ES_SEARCH_TIMEOUT_SECONDS))
    }

    pub fn with_timeout(url: &str, timeout: Duration) -> Result<Self, String> {
        let identity = qafiyah_elasticsearch::load().identity;
        Ok(Self {
            endpoint: Endpoint::new(url)?,
            timeout,
            poems_alias: identity.poems_alias,
            poets_alias: identity.poets_alias,
        })
    }

    pub async fn search(&self, index: &str, body: &Value) -> Result<Value, AppError> {
        let response = self
            .endpoint
            .request(Method::POST, &format!("/{index}/_search"))
            .timeout(self.timeout)
            .json(body)
            .send()
            .await
            .map_err(|cause| AppError::Search(format!("{index}: {cause}")))?;
        let status = response.status();
        let value: Value = response
            .json()
            .await
            .map_err(|cause| AppError::Search(format!("{index}: {cause}")))?;
        if !status.is_success() {
            return Err(AppError::Search(format!("{index}: {status}")));
        }
        Ok(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn a_search_gives_up_on_an_elasticsearch_that_never_answers() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("an ephemeral port");
        let address = listener.local_addr().expect("a bound address");
        tokio::spawn(async move {
            let mut held = Vec::new();
            while let Ok((socket, _)) = listener.accept().await {
                held.push(socket);
            }
        });

        let timeout = Duration::from_millis(250);
        let es = Es::with_timeout(&format!("http://{address}"), timeout).expect("an endpoint");
        let outcome = tokio::time::timeout(
            timeout + Duration::from_secs(5),
            es.search("poems", &serde_json::json!({})),
        )
        .await;

        let result = outcome.expect("the search must give up on its own, not be rescued");
        assert!(matches!(result, Err(AppError::Search(_))));
    }

    #[tokio::test]
    async fn a_non_success_status_with_a_json_body_is_a_search_error() {
        let es = crate::test_support::FakeEs::serving(
            axum::http::StatusCode::BAD_GATEWAY,
            serde_json::json!({ "error": "down" }),
        )
        .await;
        let client = Es::with_timeout(&es.url, Duration::from_secs(2)).expect("an endpoint");
        let result = client.search("poems", &serde_json::json!({})).await;
        assert!(matches!(result, Err(AppError::Search(message)) if message.contains("502")));
    }
}

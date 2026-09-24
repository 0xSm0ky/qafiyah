use reqwest::{Client, Method, RequestBuilder};

pub struct Endpoint {
    client: Client,
    base: String,
    user: Option<(String, String)>,
}

impl Endpoint {
    pub fn new(url: &str) -> Result<Self, String> {
        let parsed = reqwest::Url::parse(url).map_err(|e| format!("bad ELASTICSEARCH_URL: {e}"))?;
        let user = if parsed.username().is_empty() {
            None
        } else {
            Some((
                parsed.username().to_string(),
                parsed.password().unwrap_or_default().to_string(),
            ))
        };
        let mut clean = parsed.clone();
        clean
            .set_username("")
            .map_err(|()| "cannot clear username".to_string())?;
        clean
            .set_password(None)
            .map_err(|()| "cannot clear password".to_string())?;
        Ok(Self {
            client: Client::builder()
                .build()
                .map_err(|e| format!("http client: {e}"))?,
            base: clean.to_string().trim_end_matches('/').to_string(),
            user,
        })
    }

    pub fn request(&self, method: Method, path: &str) -> RequestBuilder {
        let builder = self.client.request(method, format!("{}{path}", self.base));
        match &self.user {
            Some((user, password)) => builder.basic_auth(user, Some(password)),
            None => builder,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lifts_credentials_out_of_the_url() {
        let endpoint = Endpoint::new("http://reader:secret@es.internal:9200").expect("parses");
        assert_eq!(endpoint.base, "http://es.internal:9200");
        assert_eq!(
            endpoint.user,
            Some(("reader".to_string(), "secret".to_string()))
        );
    }

    #[test]
    fn leaves_an_anonymous_url_unauthenticated() {
        let endpoint = Endpoint::new("http://localhost:9200").expect("parses");
        assert_eq!(endpoint.user, None);
    }

    #[test]
    fn trims_a_trailing_slash_from_the_base() {
        let endpoint = Endpoint::new("http://localhost:9200/").expect("parses");
        assert_eq!(endpoint.base, "http://localhost:9200");
    }

    #[test]
    fn a_password_free_userinfo_still_authenticates() {
        let endpoint = Endpoint::new("http://reader@localhost:9200").expect("parses");
        assert_eq!(endpoint.user, Some(("reader".to_string(), String::new())));
    }

    #[test]
    fn rejects_a_url_it_cannot_parse() {
        assert!(Endpoint::new("not a url").is_err());
    }

    #[test]
    fn a_request_joins_the_path_to_the_base_and_carries_basic_auth() {
        let endpoint = Endpoint::new("http://reader:secret@es.internal:9200").expect("parses");
        let request = endpoint
            .request(Method::POST, "/poems/_search")
            .build()
            .expect("a request");
        assert_eq!(
            request.url().as_str(),
            "http://es.internal:9200/poems/_search"
        );
        assert_eq!(
            request.headers()["authorization"],
            "Basic cmVhZGVyOnNlY3JldA=="
        );
        let anonymous = Endpoint::new("http://localhost:9200").expect("parses");
        assert!(
            anonymous
                .request(Method::GET, "/x")
                .build()
                .expect("a request")
                .headers()
                .get("authorization")
                .is_none()
        );
    }

    #[test]
    fn a_base_with_a_path_keeps_it_without_the_trailing_slash() {
        let endpoint = Endpoint::new("http://h/es/").expect("parses");
        assert_eq!(endpoint.base, "http://h/es");
        assert_eq!(
            endpoint
                .request(Method::GET, "/_cat")
                .build()
                .expect("a request")
                .url()
                .as_str(),
            "http://h/es/_cat"
        );
    }

    #[test]
    fn a_percent_encoded_password_is_sent_encoded_pinned_not_endorsed() {
        let endpoint = Endpoint::new("http://u:p%40ss@h:9200").expect("parses");
        assert_eq!(endpoint.user, Some(("u".to_string(), "p%40ss".to_string())));
    }

    #[test]
    fn a_password_without_a_username_is_dropped_pinned_not_endorsed() {
        let endpoint = Endpoint::new("http://:secret@h:9200").expect("parses");
        assert_eq!(endpoint.user, None);
    }
}

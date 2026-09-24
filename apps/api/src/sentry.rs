use crate::error::AppError;

pub struct Config {
    pub dsn: Option<String>,
    pub environment: String,
    pub release: Option<String>,
}

fn non_empty(value: Option<String>) -> Option<String> {
    value.filter(|v| !v.is_empty())
}

impl Config {
    pub fn from_env(environment: String) -> Self {
        Self {
            dsn: non_empty(std::env::var("SENTRY_DSN").ok()),
            environment,
            release: non_empty(std::env::var("SENTRY_RELEASE").ok()),
        }
    }

    fn enabled(&self) -> bool {
        self.dsn.is_some() && self.environment == "production"
    }
}

#[must_use]
pub fn init(config: &Config) -> Option<sentry::ClientInitGuard> {
    if !config.enabled() {
        return None;
    }
    let dsn = config.dsn.as_ref()?;
    let mut options = sentry::ClientOptions::default();
    options.release = config.release.clone().map(Into::into);
    options.environment = Some(config.environment.clone().into());
    Some(sentry::init((dsn.as_str(), options)))
}

pub fn capture(error: &AppError, code: &str, method: &str, path: &str) {
    sentry::with_scope(
        |scope| {
            scope.set_tag("code", code);
            scope.set_tag("method", method);
            scope.set_tag("path", path);
        },
        || sentry::capture_error(error),
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(dsn: Option<&str>, environment: &str) -> Config {
        Config {
            dsn: dsn.map(str::to_string),
            environment: environment.to_string(),
            release: None,
        }
    }

    #[test]
    fn reporting_needs_a_dsn_and_production() {
        assert!(config(Some("https://key@example.test/1"), "production").enabled());
        assert!(!config(Some("https://key@example.test/1"), "development").enabled());
        assert!(!config(Some("https://key@example.test/1"), "unknown").enabled());
        assert!(!config(None, "production").enabled());
    }

    #[test]
    fn an_empty_dsn_is_no_dsn() {
        assert_eq!(non_empty(None), None);
        assert_eq!(non_empty(Some(String::new())), None);
        assert_eq!(non_empty(Some("dsn".into())), Some("dsn".into()));
    }
}

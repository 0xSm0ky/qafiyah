use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Deserialize)]
pub struct Identity {
    pub provider: String,
    pub provider_uid: String,
    pub email: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Profile {
    pub id: i64,
    pub email: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

pub fn normalize_email(raw: &str) -> String {
    raw.trim().to_lowercase()
}

#[derive(Debug, thiserror::Error)]
pub enum UpsertError {
    #[error("this email already belongs to a different account")]
    EmailTaken,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

pub async fn upsert(accounts: &PgPool, identity: &Identity) -> Result<Profile, UpsertError> {
    let email = normalize_email(&identity.email);
    let mut tx = accounts.begin().await?;

    let linked: Option<i64> = sqlx::query_scalar(
        "SELECT user_id FROM identities WHERE provider = $1 AND provider_uid = $2",
    )
    .bind(&identity.provider)
    .bind(&identity.provider_uid)
    .fetch_optional(&mut *tx)
    .await?;

    let profile = if let Some(user_id) = linked {
        let taken: Option<i64> =
            sqlx::query_scalar("SELECT id FROM users WHERE lower(email) = $1 AND id <> $2")
                .bind(&email)
                .bind(user_id)
                .fetch_optional(&mut *tx)
                .await?;
        if taken.is_some() {
            return Err(UpsertError::EmailTaken);
        }
        sqlx::query_as::<_, Profile>(
            r#"
      UPDATE users
      SET email = $1,
          display_name = COALESCE($2, display_name),
          avatar_url   = COALESCE($3, avatar_url)
      WHERE id = $4
      RETURNING id, email, display_name, avatar_url
      "#,
        )
        .bind(&email)
        .bind(&identity.display_name)
        .bind(&identity.avatar_url)
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await?
    } else {
        sqlx::query_as::<_, Profile>(
            r#"
      INSERT INTO users (email, display_name, avatar_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (lower(email)) DO UPDATE
        SET display_name = COALESCE(EXCLUDED.display_name, users.display_name),
            avatar_url   = COALESCE(EXCLUDED.avatar_url,   users.avatar_url)
      RETURNING id, email, display_name, avatar_url
      "#,
        )
        .bind(&email)
        .bind(&identity.display_name)
        .bind(&identity.avatar_url)
        .fetch_one(&mut *tx)
        .await?
    };

    sqlx::query(
        r#"
      INSERT INTO identities (provider, provider_uid, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (provider, provider_uid) DO UPDATE SET user_id = EXCLUDED.user_id
      "#,
    )
    .bind(&identity.provider)
    .bind(&identity.provider_uid)
    .bind(profile.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(profile)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn identity(provider: &str, uid: &str, email: &str) -> Identity {
        Identity {
            provider: provider.to_string(),
            provider_uid: uid.to_string(),
            email: email.to_string(),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
        }
    }

    #[test]
    fn an_identity_carries_the_provider_and_its_stable_uid() {
        let id = identity("google", "12345", "a@example.test");
        assert_eq!(id.provider, "google");
        assert_eq!(id.provider_uid, "12345");
    }

    #[test]
    fn emails_are_compared_case_insensitively() {
        assert_eq!(normalize_email("A@Example.TEST"), "a@example.test");
        assert_eq!(normalize_email("  a@example.test "), "a@example.test");
    }
}

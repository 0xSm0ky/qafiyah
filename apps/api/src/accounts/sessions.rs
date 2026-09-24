use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use rand::RngExt;
use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::accounts::users::Profile;
use crate::constants::{SESSION_ID_BYTES, SESSION_TTL_DAYS};

pub fn generate_id() -> Vec<u8> {
    let mut rng = rand::rng();
    (0..SESSION_ID_BYTES).map(|_| rng.random::<u8>()).collect()
}

fn hash_id(id: &[u8]) -> Vec<u8> {
    Sha256::digest(id).to_vec()
}

pub fn encode_id(id: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(id)
}

pub fn decode_id(encoded: &str) -> Option<Vec<u8>> {
    let decoded = URL_SAFE_NO_PAD.decode(encoded).ok()?;
    (decoded.len() == SESSION_ID_BYTES).then_some(decoded)
}

pub async fn create(accounts: &PgPool, user_id: i64) -> Result<Vec<u8>, sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE expires_at <= now()")
        .execute(accounts)
        .await?;
    let id = generate_id();
    sqlx::query(
        r#"
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES ($1, $2, now() + make_interval(days => $3))
    "#,
    )
    .bind(hash_id(&id))
    .bind(user_id)
    .bind(i32::try_from(SESSION_TTL_DAYS).unwrap_or(30))
    .execute(accounts)
    .await?;
    Ok(id)
}

pub async fn resolve(accounts: &PgPool, id: &[u8]) -> Result<Option<Profile>, sqlx::Error> {
    sqlx::query_as::<_, Profile>(
        r#"
      SELECT u.id, u.email, u.display_name, u.avatar_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()
      LIMIT 1
    "#,
    )
    .bind(hash_id(id))
    .fetch_optional(accounts)
    .await
}

pub async fn delete(accounts: &PgPool, id: &[u8]) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE id = $1")
        .bind(hash_id(id))
        .execute(accounts)
        .await?;
    Ok(())
}

pub async fn delete_all_for(accounts: &PgPool, user_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(accounts)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn a_generated_id_is_the_documented_length() {
        assert_eq!(generate_id().len(), SESSION_ID_BYTES);
    }

    #[test]
    fn two_generated_ids_never_collide() {
        let mut seen = HashSet::new();
        for _ in 0..1_000 {
            assert!(seen.insert(generate_id()));
        }
    }

    #[test]
    fn encoding_round_trips() {
        let id = generate_id();
        let encoded = encode_id(&id);
        assert_eq!(decode_id(&encoded), Some(id));
    }

    #[test]
    fn a_malformed_cookie_value_decodes_to_nothing() {
        assert_eq!(decode_id("not base64url!!"), None);
        assert_eq!(decode_id(""), None);
        assert_eq!(decode_id("c2hvcnQ"), None);
    }
}

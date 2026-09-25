use rand::RngExt;
use serde::Serialize;
use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::constants::{
    API_KEY_BODY_LENGTH, API_KEY_DISPLAY_PREFIX_LENGTH, API_KEY_PREFIX, MAX_ACTIVE_KEYS_PER_USER,
};

const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const UNBIASED_CEILING: u8 = 248;

pub struct RawKey {
    pub value: String,
    pub prefix: String,
    pub hash: [u8; 32],
}

pub fn generate() -> RawKey {
    let mut rng = rand::rng();
    let target_len = API_KEY_PREFIX.len().saturating_add(API_KEY_BODY_LENGTH);
    let mut value = String::with_capacity(target_len);
    value.push_str(API_KEY_PREFIX);
    while value.len() < target_len {
        let byte: u8 = rng.random();
        if byte >= UNBIASED_CEILING {
            continue;
        }
        let Some(&ch) = ALPHABET.get(usize::from(byte).rem_euclid(ALPHABET.len())) else {
            continue;
        };
        value.push(char::from(ch));
    }
    let hash = hash(&value);
    let prefix = prefix_of(&value);
    RawKey {
        value,
        prefix,
        hash,
    }
}

pub fn hash(raw: &str) -> [u8; 32] {
    Sha256::digest(raw.as_bytes()).into()
}

pub fn prefix_of(raw: &str) -> String {
    raw.chars().take(API_KEY_DISPLAY_PREFIX_LENGTH).collect()
}

pub fn is_well_formed(raw: &str) -> bool {
    let Some(body) = raw.strip_prefix(API_KEY_PREFIX) else {
        return false;
    };
    body.len() == API_KEY_BODY_LENGTH && body.bytes().all(|b| b.is_ascii_alphanumeric())
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Caller {
    pub key_id: i64,
    pub user_id: i64,
    pub requests: u32,
    pub burst: u32,
    pub ip_ceiling: Option<u32>,
}

#[derive(sqlx::FromRow)]
struct CallerRow {
    key_id: i64,
    user_id: i64,
    requests: i32,
    burst: i32,
    ip_ceiling: Option<i32>,
}

pub async fn lookup(accounts: &PgPool, raw: &str) -> Result<Option<Caller>, sqlx::Error> {
    let row = sqlx::query_as::<_, CallerRow>(
        r#"
      SELECT k.id AS key_id, u.id AS user_id, p.requests, p.burst, p.ip_ceiling
      FROM api_keys k
      JOIN users u ON u.id = k.user_id
      JOIN plans p ON p.slug = u.plan
      WHERE k.key_hash = $1 AND k.revoked_at IS NULL
      LIMIT 1
    "#,
    )
    .bind(hash(raw).as_slice())
    .fetch_optional(accounts)
    .await?;

    Ok(row.map(|row| Caller {
        key_id: row.key_id,
        user_id: row.user_id,
        requests: row.requests.max(0).cast_unsigned(),
        burst: row.burst.max(0).cast_unsigned(),
        ip_ceiling: row.ip_ceiling.map(|ceiling| ceiling.max(0).cast_unsigned()),
    }))
}

#[derive(Debug, thiserror::Error)]
pub enum KeyError {
    #[error("at most {} active keys per user", MAX_ACTIVE_KEYS_PER_USER)]
    TooMany,
    #[error("no user with this id")]
    NoSuchUser,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct KeySummary {
    pub id: i64,
    pub prefix: String,
    pub label: Option<String>,
    pub created_at: String,
    pub last_used_at: Option<String>,
    pub requests_this_hour: i64,
}

pub async fn list_for(accounts: &PgPool, user_id: i64) -> Result<Vec<KeySummary>, sqlx::Error> {
    sqlx::query_as::<_, KeySummary>(
        r#"
      SELECT k.id,
             k.prefix,
             k.label,
             to_char(k.created_at,   'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
             to_char(k.last_used_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_used_at,
             COALESCE(u.requests, 0)::bigint AS requests_this_hour
      FROM api_keys k
      LEFT JOIN usage_hourly u
        ON u.api_key_id = k.id
       AND u.hour = date_trunc('hour', now())
      WHERE k.user_id = $1 AND k.revoked_at IS NULL
      ORDER BY k.created_at
    "#,
    )
    .bind(user_id)
    .fetch_all(accounts)
    .await
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PlanView {
    pub plan: String,
    pub requests: i32,
    pub burst: i32,
    pub used: i64,
}

pub async fn plan_for(accounts: &PgPool, user_id: i64) -> Result<Option<PlanView>, sqlx::Error> {
    sqlx::query_as::<_, PlanView>(
        r#"
      SELECT p.slug AS plan,
             p.requests,
             p.burst,
             COALESCE((
               SELECT sum(h.requests)
               FROM usage_hourly h
               JOIN api_keys k ON k.id = h.api_key_id
               WHERE k.user_id = $1 AND h.hour = date_trunc('hour', now())
             ), 0)::bigint AS used
      FROM users u
      JOIN plans p ON p.slug = u.plan
      WHERE u.id = $1
    "#,
    )
    .bind(user_id)
    .fetch_optional(accounts)
    .await
}

pub async fn create_for(
    accounts: &PgPool,
    user_id: i64,
    label: Option<&str>,
) -> Result<RawKey, KeyError> {
    let mut tx = accounts.begin().await?;

    let user = sqlx::query("SELECT id FROM users WHERE id = $1 FOR UPDATE")
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;
    if user.is_none() {
        return Err(KeyError::NoSuchUser);
    }

    let active: i64 = sqlx::query_scalar(
        r#"
      SELECT count(*) FROM api_keys
      WHERE user_id = $1 AND revoked_at IS NULL
    "#,
    )
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;

    if active >= MAX_ACTIVE_KEYS_PER_USER {
        return Err(KeyError::TooMany);
    }

    let key = generate();
    sqlx::query(
        r#"
      INSERT INTO api_keys (user_id, key_hash, prefix, label)
      VALUES ($1, $2, $3, $4)
    "#,
    )
    .bind(user_id)
    .bind(key.hash.as_slice())
    .bind(&key.prefix)
    .bind(label)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(key)
}

pub async fn revoke(accounts: &PgPool, user_id: i64, key_id: i64) -> Result<u64, sqlx::Error> {
    let done = sqlx::query(
        r#"
      UPDATE api_keys SET revoked_at = now()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
    "#,
    )
    .bind(key_id)
    .bind(user_id)
    .execute(accounts)
    .await?;
    Ok(done.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn a_generated_key_has_the_documented_shape() {
        let key = generate();
        assert!(key.value.starts_with(API_KEY_PREFIX));
        assert_eq!(key.value.len(), API_KEY_PREFIX.len() + API_KEY_BODY_LENGTH);
        assert!(
            key.value
                .chars()
                .skip(API_KEY_PREFIX.len())
                .all(|c| c.is_ascii_alphanumeric())
        );
    }

    #[test]
    fn the_prefix_is_the_leading_slice_of_the_raw_key() {
        let key = generate();
        assert_eq!(
            key.prefix,
            key.value
                .get(..API_KEY_DISPLAY_PREFIX_LENGTH)
                .expect("a long key")
        );
        assert_eq!(prefix_of(&key.value), key.prefix);
    }

    #[test]
    fn the_stored_hash_is_reproducible_from_the_raw_key() {
        let key = generate();
        assert_eq!(hash(&key.value), key.hash);
    }

    #[test]
    fn two_generated_keys_never_collide() {
        let mut seen = HashSet::new();
        for _ in 0..1_000 {
            assert!(seen.insert(generate().value));
        }
    }

    #[test]
    fn hashing_is_stable_across_calls_and_differs_per_input() {
        assert_eq!(hash("qaf_aaaa"), hash("qaf_aaaa"));
        assert_ne!(hash("qaf_aaaa"), hash("qaf_aaab"));
    }

    #[test]
    fn hashing_matches_the_standard_sha256_vector_so_stored_keys_survive_upgrades() {
        let hex: String = hash("abc").iter().map(|b| format!("{b:02x}")).collect();
        assert_eq!(
            hex,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn the_active_key_ceiling_is_two() {
        assert_eq!(MAX_ACTIVE_KEYS_PER_USER, 2);
    }

    #[test]
    fn a_key_error_reports_which_limit_was_hit() {
        assert!(format!("{}", KeyError::TooMany).contains('2'));
    }

    #[test]
    fn a_short_key_yields_a_prefix_no_longer_than_itself() {
        assert_eq!(prefix_of("qaf_ab"), "qaf_ab");
    }

    #[test]
    fn a_key_is_well_formed_only_with_the_prefix_and_thirty_two_alphanumerics() {
        assert!(is_well_formed("qaf_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"));
        assert!(is_well_formed("qaf_00000000000000000000000000000000"));
        for raw in [
            "",
            "qaf_",
            "qaf_short",
            "qaf_ABCDEFGHIJKLMNOPQRSTUVWXYZabcde",
            "qaf_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg",
            "qaf_ABCDEFGHIJKLMNOPQRSTUVWXYZabcde-",
            "xaf_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef",
            "QAF_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef",
        ] {
            assert!(!is_well_formed(raw), "should reject {raw:?}");
        }
    }
}

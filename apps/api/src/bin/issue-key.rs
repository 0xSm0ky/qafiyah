#![expect(
    clippy::print_stdout,
    reason = "the issued key is this command's output"
)]
#![expect(
    clippy::print_stderr,
    reason = "usage and database errors go to stderr"
)]

use qafiyah_api::accounts::keys;
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    let mut args = std::env::args().skip(1);
    let Some(email) = args.next() else {
        eprintln!("usage: issue-key <email> [label]");
        std::process::exit(2);
    };
    let label = args.next();

    let url = match std::env::var("DATABASE_URL_ACCOUNTS") {
        Ok(url) => url,
        Err(_) => {
            eprintln!("DATABASE_URL_ACCOUNTS is required");
            std::process::exit(1);
        }
    };

    let pool = match PgPoolOptions::new().max_connections(1).connect(&url).await {
        Ok(pool) => pool,
        Err(e) => {
            eprintln!("could not connect: {e}");
            std::process::exit(1);
        }
    };

    let user_id: i64 = match sqlx::query_scalar(
        r#"
      INSERT INTO users (email) VALUES ($1)
      ON CONFLICT (lower(email)) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    "#,
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    {
        Ok(id) => id,
        Err(e) => {
            eprintln!("could not upsert the user: {e}");
            std::process::exit(1);
        }
    };

    let key = keys::generate();
    if let Err(e) = sqlx::query(
        r#"
      INSERT INTO api_keys (user_id, key_hash, prefix, label)
      VALUES ($1, $2, $3, $4)
    "#,
    )
    .bind(user_id)
    .bind(key.hash.as_slice())
    .bind(&key.prefix)
    .bind(label.as_deref())
    .execute(&pool)
    .await
    {
        eprintln!("could not insert the key: {e}");
        std::process::exit(1);
    }

    println!("user:   {email} (id {user_id})");
    println!("prefix: {}", key.prefix);
    println!("key:    {}", key.value);
    println!();
    println!("This is the only time the key is shown. Store it now.");
}

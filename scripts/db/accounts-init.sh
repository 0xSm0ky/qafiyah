#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PG_ACCOUNTS_PASSWORD:-}" ]]; then
  echo "[accounts-init] PG_ACCOUNTS_PASSWORD unset; refusing to create the accounts database" >&2
  exit 1
fi

echo "[accounts-init] creating role and database qafiyah_accounts..."

psql -v ON_ERROR_STOP=1 -v accounts_pw="${PG_ACCOUNTS_PASSWORD}" \
  --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<'SQL'
SELECT 'CREATE ROLE qafiyah_accounts LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qafiyah_accounts')
\gexec
ALTER ROLE qafiyah_accounts WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'accounts_pw';
SQL

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<'SQL'
SELECT 'CREATE DATABASE qafiyah_accounts OWNER qafiyah_accounts'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'qafiyah_accounts')
\gexec
SQL

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname qafiyah_accounts <<'SQL'
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO qafiyah_accounts;
REVOKE CONNECT ON DATABASE qafiyah_accounts FROM PUBLIC;
GRANT CONNECT ON DATABASE qafiyah_accounts TO qafiyah_accounts;
SQL

echo "[accounts-init] done"

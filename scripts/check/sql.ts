#!/usr/bin/env bun

import { hasSqlDetails, parse, parsePlPgSQL } from 'libpg-query';

import { reportViolations } from '../lib/report';
import { ROOT } from '../lib/root';
import { listTrackedFiles } from '../lib/tracked-files';

const PSQL_VARIABLE = /(?<![:\w]):(?:'[A-Za-z_]\w*'|"[A-Za-z_]\w*"|[A-Za-z_]\w*)/g;

const PSQL_PLACEHOLDERS = { "'": "'psql'", '"': '"psql"' } as const;

function substitutePsqlVariables(sql: string): string {
  return sql.replaceAll(PSQL_VARIABLE, (variable) => {
    const quote = variable.charAt(1);
    return quote === "'" || quote === '"' ? PSQL_PLACEHOLDERS[quote] : 'NULL';
  });
}

function describe(error: unknown, sql: string): string {
  if (hasSqlDetails(error)) {
    const position = error.sqlDetails?.cursorPosition;
    if (position !== undefined) {
      const line = sql.slice(0, position).split('\n').length;
      return `line ${line}: ${error.message}`;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

async function syntaxError(path: string): Promise<string | undefined> {
  const sql = substitutePsqlVariables(await Bun.file(`${ROOT}/${path}`).text());
  try {
    await parse(sql);
    await parsePlPgSQL(sql);
    return undefined;
  } catch (error) {
    return `${path}: ${describe(error, sql)}`;
  }
}

const tracked = listTrackedFiles();
if (tracked.isErr()) {
  console.error(tracked.error);
  process.exit(1);
}

const files = tracked.value.filter((path) => path.endsWith('.sql'));
const errors = await Promise.all(files.map((path) => syntaxError(path)));

process.exit(
  reportViolations({
    title: 'SQL the PostgreSQL 18 parser rejects:',
    lines: errors.filter((error): error is string => error !== undefined),
    rule: ['Each .sql file must parse, PL/pgSQL function and DO bodies included.'],
    ok: `PostgreSQL 18 parser accepts all ${files.length} SQL files, PL/pgSQL bodies included.`,
  })
);

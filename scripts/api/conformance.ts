#!/usr/bin/env bun

import Ajv2020 from 'ajv/dist/2020';

import { API_KEY_HEADER, API_V1_PREFIX, DEV_API_PORT, PROD_API_URL } from '@qafiyah/config';

import { resolveWorktreeIdentity } from '../dev/worktree';

type Operation = {
  readonly parameters?: readonly {
    readonly in: string;
    readonly name: string;
    readonly required?: boolean;
    readonly example?: string | number;
  }[];
  readonly responses: Record<string, { readonly content?: Record<string, { schema?: object }> }>;
};

const spec = (await Bun.file('apps/api/generated/openapi/openapi.json').json()) as {
  paths: Record<string, Record<string, Operation>>;
  components?: Record<string, unknown>;
};

const target = process.argv.includes('prod') ? 'prod' : 'dev';

let offset = 0;
if (process.argv.includes('--worktree')) {
  const identity = await resolveWorktreeIdentity();
  if (!identity.isWorktree) {
    console.error('--worktree passed but this is the primary checkout, nothing to isolate against');
    process.exit(2);
  }
  offset = identity.offset;
}

const base =
  target === 'prod'
    ? `${PROD_API_URL}${API_V1_PREFIX}`
    : `http://localhost:${DEV_API_PORT + offset}${API_V1_PREFIX}`;
const apiKey = process.env['SMOKE_API_KEY'] ?? process.env['API_KEY_FULL'];

const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  formats: { int32: true, int64: true, float: true, double: true, uri: true },
});

function stripDialect(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => stripDialect(entry));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (key === '$schema') continue;
      out[key] = stripDialect(inner);
    }
    return out;
  }
  return value;
}

type Failure = { op: string; detail: string };
const failures: Failure[] = [];
let checked = 0;
let skipped = 0;

function fillPath(path: string, op: Operation): string | null {
  let filled = path;
  for (const param of op.parameters ?? []) {
    if (param.in !== 'path') continue;
    const example = param.example;
    if (example === undefined) return null;
    filled = filled.replace(`{${param.name}}`, encodeURIComponent(String(example)));
  }
  return filled;
}

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const label = `${method.toUpperCase()} ${path}`;
    const filled = fillPath(path, op);
    if (filled === null) {
      skipped++;
      console.log(`  SKIP  ${label}  (no example for a path parameter)`);
      continue;
    }

    const res = await fetch(`${base}${filled}`, {
      method: method.toUpperCase(),
      headers: apiKey ? { [API_KEY_HEADER]: apiKey } : {},
    }).catch((cause) => cause as Error);

    if (res instanceof Error) {
      failures.push({ op: label, detail: `request failed: ${res.message}` });
      continue;
    }

    checked++;
    const status = String(res.status);
    const declared = op.responses[status];
    if (!declared) {
      failures.push({
        op: label,
        detail: `returned ${status}, which the spec does not declare (declared: ${Object.keys(op.responses).join(', ')})`,
      });
      continue;
    }

    const schema = declared.content?.['application/json']?.schema;
    if (!schema) {
      console.log(`  OK    ${label}  ${status} (no json schema declared)`);
      continue;
    }

    const body = await res.json().catch(() => null);
    const validate = ajv.compile({
      ...(stripDialect(schema) as object),
      components: stripDialect(spec.components) as object,
    });
    if (validate(body)) {
      console.log(`  OK    ${label}  ${status}`);
      continue;
    }
    const first = validate.errors?.[0];
    failures.push({
      op: label,
      detail: `${status} body does not match the declared schema: ${first?.instancePath || '/'} ${first?.message ?? 'invalid'}`,
    });
  }
}

console.log('');
if (failures.length > 0) {
  console.error(`Conformance failures against ${target} (${base}):\n`);
  for (const f of failures) console.error(`  ${f.op}\n      ${f.detail}`);
  console.error('');
  process.exit(1);
}
console.log(
  `Conformance ok against ${target}: ${checked} operations validated, ${skipped} skipped.`
);

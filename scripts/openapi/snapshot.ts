#!/usr/bin/env bun

import { cargoDump } from '../lib/cargo';
import { snapshot } from '../lib/snapshot';

const OUT = 'apps/api/generated/openapi/openapi.json';

const dumped = cargoDump('openapi-dump');
if (dumped.isErr()) {
  console.error(dumped.error);
  process.exit(1);
}

const rendered = dumped.value;
const paths = Object.keys((JSON.parse(rendered) as { paths?: object }).paths ?? {}).length;

process.exit(
  await snapshot({
    out: OUT,
    rendered,
    summary: `${paths} paths`,
    remedy: ['Run: bun run openapi:snapshot, then review the diff.'],
    check: process.argv.includes('--check'),
  })
);

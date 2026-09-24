#!/usr/bin/env bun

import {
  API_KEY_HEADER,
  API_V1_PREFIX,
  DEV_API_PORT,
  DEV_EDGE_PORT,
  PROD_API_URL,
} from '@qafiyah/config';

const DEFAULT_REQUESTS = 10;
const DRAIN_CEILING = 10_000;
const DRAIN_INTERVAL_MS = 120;
const DRAIN_RETRIES = 3;
const BURST_RETRY_SECONDS = 5;
const EDGE_PROBE_TIMEOUT_MS = 1000;
const PROBE_PATH = `${API_V1_PREFIX}/meters`;

const LIMIT_HEADER = 'x-ratelimit-limit';
const REMAINING_HEADER = 'x-ratelimit-remaining';
const RESET_HEADER = 'x-ratelimit-reset';
const CACHE_HEADER = 'x-cache-status';

const API_HOST = new URL(PROD_API_URL).host;
const RUN_ID = Date.now().toString(36);

type Args = {
  readonly key: string | undefined;
  readonly count: number;
  readonly drain: boolean;
};

type Probe = {
  readonly status: number;
  readonly limit: number | undefined;
  readonly remaining: number | undefined;
  readonly reset: number | undefined;
  readonly retryAfter: number | undefined;
  readonly cached: boolean;
};

const dim = (s: string) => `\u001B[2m${s}\u001B[0m`;
const bold = (s: string) => `\u001B[1m${s}\u001B[0m`;
const red = (s: string) => `\u001B[31m${s}\u001B[0m`;
const green = (s: string) => `\u001B[32m${s}\u001B[0m`;
const yellow = (s: string) => `\u001B[33m${s}\u001B[0m`;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const EDGE_URL = `http://localhost:${DEV_EDGE_PORT}`;
const DIRECT_API_URL = `http://localhost:${DEV_API_PORT}`;

async function isReachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(EDGE_PROBE_TIMEOUT_MS) });
    return true;
  } catch {
    return false;
  }
}

async function resolveBaseUrl(): Promise<string> {
  const configured = process.env['QUOTA_API_URL'];
  if (configured !== undefined) return configured;
  return (await isReachable(EDGE_URL)) ? EDGE_URL : DIRECT_API_URL;
}

const BASE_URL = await resolveBaseUrl();

function targetsLoopback(): boolean {
  const { hostname } = new URL(BASE_URL);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

let probesSent = 0;

function probeUrl(): string {
  probesSent += 1;
  return `${BASE_URL}${PROBE_PATH}?quota=${RUN_ID}-${probesSent}`;
}

function parseArgs(argv: readonly string[]): Args {
  const rest = argv.filter((a) => a !== '--drain');
  const drain = argv.includes('--drain');
  const key = rest.find((a) => a.startsWith('qaf_') || (!a.startsWith('--') && !/^\d+$/u.test(a)));
  const countArg = rest.find((a) => /^\d+$/u.test(a));
  const count = countArg === undefined ? DEFAULT_REQUESTS : Number(countArg);
  return { key, count, drain };
}

function numberHeader(response: Response, name: string): number | undefined {
  const raw = response.headers.get(name);
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

async function hit(key: string | undefined): Promise<Probe> {
  const headers = new Headers();
  if (key !== undefined) headers.set(API_KEY_HEADER, key);
  if (targetsLoopback()) headers.set('host', API_HOST);
  const response = await fetch(probeUrl(), { headers });
  await response.arrayBuffer();
  return {
    status: response.status,
    limit: numberHeader(response, LIMIT_HEADER),
    remaining: numberHeader(response, REMAINING_HEADER),
    reset: numberHeader(response, RESET_HEADER),
    retryAfter: numberHeader(response, 'retry-after'),
    cached: (response.headers.get(CACHE_HEADER) ?? '').toUpperCase() === 'HIT',
  };
}

function isBurst(probe: Probe): boolean {
  return probe.retryAfter !== undefined && probe.retryAfter <= BURST_RETRY_SECONDS;
}

function line(index: number, total: number, probe: Probe): string {
  const n = dim(`${String(index).padStart(String(total).length)}/${total}`);
  const status = probe.status === 429 ? red('429') : green(String(probe.status));
  const remaining = probe.remaining === undefined ? dim('n/a') : String(probe.remaining);
  const which = probe.status === 429 ? ` ${isBurst(probe) ? 'burst' : 'hourly'}` : '';
  const retry =
    probe.retryAfter === undefined ? '' : yellow(`  retry-after ${probe.retryAfter}s${which}`);
  const cached = probe.cached ? red('  CACHED') : '';
  return `  ${n}  ${status}  remaining ${remaining}${retry}${cached}`;
}

async function drainHit(key: string | undefined): Promise<Probe> {
  let probe = await hit(key);
  for (
    let attempt = 0;
    attempt < DRAIN_RETRIES && probe.status === 429 && isBurst(probe);
    attempt += 1
  ) {
    await sleep((probe.retryAfter ?? 1) * 1000);
    probe = await hit(key);
  }
  return probe;
}

async function main(): Promise<void> {
  const { key, count, drain } = parseArgs(process.argv.slice(2));

  console.log(bold('\nquota probe'));
  console.log(`  target   ${BASE_URL}${PROBE_PATH}`);
  if (BASE_URL === DIRECT_API_URL) {
    console.log(dim(`           edge gateway not running, probing the api directly`));
  }
  if (targetsLoopback()) console.log(`  host     ${API_HOST}`);
  console.log(
    `  caller   ${key === undefined ? 'anonymous (per-IP bucket)' : `${key.slice(0, 12)}…`}\n`
  );

  const first = await hit(key);
  if (first.limit === undefined) {
    console.error(
      red('  no x-ratelimit headers came back.\n') +
        dim(
          '  Is the stack up (bun run dev), and does QUOTA_API_URL point at the edge or the api?\n' +
            '  A response from the website rather than the api means the Host header was dropped.\n'
        )
    );
    process.exit(1);
  }

  console.log(`  limit    ${first.limit} per window`);
  if (first.reset !== undefined) {
    const seconds = Math.max(0, first.reset - Math.floor(Date.now() / 1000));
    console.log(`  resets   in ${Math.floor(seconds / 60)}m ${seconds % 60}s\n`);
  }

  let planned = count;
  if (drain) {
    const remaining = first.remaining ?? 0;
    if (remaining > DRAIN_CEILING) {
      console.error(
        red(`  refusing to drain ${remaining} requests.\n`) +
          dim(
            '  Outside production the anonymous limit is effectively unlimited.\n' +
              '  Pass a key, or restart the API with ANON_REQUESTS=20.\n'
          )
      );
      process.exit(1);
    }
    planned = remaining + 1;
    console.log(
      dim(`  draining ${remaining} remaining, pacing under the burst limit, then one more\n`)
    );
  }

  console.log(line(1, planned + 1, first));
  let sawHourly = first.status === 429 && !isBurst(first);
  let sawBurst = first.status === 429 && isBurst(first);
  let sawCached = first.cached;

  for (let i = 0; i < planned; i += 1) {
    if (drain) await sleep(DRAIN_INTERVAL_MS);
    const probe = drain ? await drainHit(key) : await hit(key);
    console.log(line(i + 2, planned + 1, probe));
    if (probe.cached) sawCached = true;
    if (probe.status === 429) {
      if (isBurst(probe)) sawBurst = true;
      else sawHourly = true;
    }
  }

  console.log('');
  if (sawCached) {
    console.log(
      red('  some responses came from the edge cache, so those never reached the limiter.\n')
    );
  }
  if (sawHourly) {
    console.log(green('  the hourly quota is enforced: a 429 was returned.\n'));
  } else if (sawBurst) {
    console.log(
      green('  the burst limit is enforced: a 429 was returned within the second.\n') +
        dim('  Pass --drain to spend the hourly allowance instead.\n')
    );
  } else {
    const last = await hit(key);
    console.log(dim(`  no 429 yet. ${last.remaining ?? '?'} of ${last.limit} left this window.\n`));
  }
}

await main();

#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { extractSpecifiers } from '../lib/imports';
import { reportViolations } from '../lib/report';
import { ROOT } from '../lib/root';
import { walkFiles } from '../lib/walk';

const APPS = readdirSync(join(ROOT, 'apps'))
  .filter((entry) => existsSync(join(ROOT, 'apps', entry, 'package.json')))
  .sort();

type App = string;

function classifyCrossApp(spec: string, fromFile: string, ownApp: App): App | null {
  for (const otherApp of APPS) {
    if (otherApp === ownApp) continue;
    if (spec === `@qafiyah/${otherApp}` || spec.startsWith(`@qafiyah/${otherApp}/`))
      return otherApp;
  }
  if (spec.startsWith('.')) {
    const resolved = resolve(dirname(fromFile), spec);
    for (const otherApp of APPS) {
      if (otherApp === ownApp) continue;
      const siblingDir = join(ROOT, 'apps', otherApp);
      if (resolved === siblingDir || resolved.startsWith(`${siblingDir}/`)) return otherApp;
    }
  } else {
    for (const otherApp of APPS) {
      if (otherApp === ownApp) continue;
      if (spec.includes(`apps/${otherApp}/`) || spec.endsWith(`apps/${otherApp}`)) return otherApp;
    }
  }
  return null;
}

function scanSources(): string[] {
  const violations: string[] = [];
  for (const app of APPS) {
    const appDir = join(ROOT, 'apps', app);
    for (const file of walkFiles(appDir)) {
      const content = readFileSync(file, 'utf8');
      for (const { spec } of extractSpecifiers(content)) {
        const target = classifyCrossApp(spec, file, app);
        if (target) {
          violations.push(`${relative(ROOT, file)}: imports "${spec}" (apps/${target})`);
        }
      }
    }
  }
  return violations;
}

function scanPackageJson(): string[] {
  const violations: string[] = [];
  for (const app of APPS) {
    const pkgPath = join(ROOT, 'apps', app, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    for (const otherApp of APPS) {
      if (otherApp === app) continue;
      const name = `@qafiyah/${otherApp}`;
      if (deps[name]) {
        violations.push(`apps/${app}/package.json: declares dependency on ${name}`);
      }
    }
  }
  return violations;
}

const violations = [...scanPackageJson(), ...scanSources()];

process.exit(
  reportViolations({
    title: 'Cross-app imports detected:',
    lines: violations,
    rule: [
      'Apps must not depend on sibling apps. Move shared code to packages/* or call across HTTP.',
    ],
    ok: 'No cross-app imports.',
  })
);

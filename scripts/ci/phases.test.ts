import { describe, expect, test } from 'bun:test';

import { selectPhases, type Phase } from './phases';

const PHASES: readonly Phase[] = [
  { name: 'static', tasks: [], kind: 'sequential' },
  { name: 'checks', tasks: [], kind: 'parallel' },
  { name: 'db', tasks: [], kind: 'docker' },
  { name: 'stack', tasks: [], kind: 'docker' },
];

const names = (phases: readonly Phase[]): readonly string[] => phases.map((p) => p.name);

describe('selectPhases', () => {
  test('with no flags every phase runs in order', () => {
    const selected = selectPhases(PHASES, { noDocker: false, dockerOnly: false });
    expect(selected.isOk() && names(selected.value)).toEqual(['static', 'checks', 'db', 'stack']);
  });

  test('--no-docker drops the docker phases', () => {
    const selected = selectPhases(PHASES, { noDocker: true, dockerOnly: false });
    expect(selected.isOk() && names(selected.value)).toEqual(['static', 'checks']);
  });

  test('--docker-only keeps only the docker phases', () => {
    const selected = selectPhases(PHASES, { noDocker: false, dockerOnly: true });
    expect(selected.isOk() && names(selected.value)).toEqual(['db', 'stack']);
  });

  test('--no-docker and --docker-only together are rejected', () => {
    const selected = selectPhases(PHASES, { noDocker: true, dockerOnly: true });
    expect(selected.isErr() && selected.error).toBe(
      '--no-docker and --docker-only exclude each other'
    );
  });

  test('--phase narrows the run to that one phase', () => {
    const selected = selectPhases(PHASES, { phase: 'checks', noDocker: false, dockerOnly: false });
    expect(selected.isOk() && names(selected.value)).toEqual(['checks']);
  });

  test('an unknown --phase names the valid ones', () => {
    const selected = selectPhases(PHASES, { phase: 'images', noDocker: false, dockerOnly: false });
    expect(selected.isErr() && selected.error).toBe(
      'unknown phase "images", expected one of static, checks, db, stack'
    );
  });

  test('a docker --phase under --no-docker is a contradiction, not a silent no-op', () => {
    const selected = selectPhases(PHASES, { phase: 'db', noDocker: true, dockerOnly: false });
    expect(selected.isErr() && selected.error).toBe('phase "db" is excluded by --no-docker');
  });

  test('a non-docker --phase under --docker-only is a contradiction too', () => {
    const selected = selectPhases(PHASES, { phase: 'static', noDocker: false, dockerOnly: true });
    expect(selected.isErr() && selected.error).toBe('phase "static" is excluded by --docker-only');
  });
});

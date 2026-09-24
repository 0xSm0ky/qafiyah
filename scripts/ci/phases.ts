import { err, ok, type Result } from 'neverthrow';

export type Task = { name: string; cmd: string[]; advisory?: boolean };

export type Phase = {
  readonly name: string;
  readonly tasks: readonly Task[];
  readonly kind: 'sequential' | 'parallel' | 'docker';
};

export type PhaseSelection = {
  readonly phase?: string;
  readonly noDocker: boolean;
  readonly dockerOnly: boolean;
};

const isDocker = (phase: Phase): boolean => phase.kind === 'docker';

export function selectPhases(
  phases: readonly Phase[],
  selection: PhaseSelection
): Result<readonly Phase[], string> {
  if (selection.noDocker && selection.dockerOnly) {
    return err('--no-docker and --docker-only exclude each other');
  }
  const excluded = (phase: Phase): string | undefined => {
    if (selection.noDocker && isDocker(phase)) return '--no-docker';
    if (selection.dockerOnly && !isDocker(phase)) return '--docker-only';
    return undefined;
  };
  if (selection.phase !== undefined) {
    const wanted = selection.phase;
    const found = phases.find((phase) => phase.name === wanted);
    if (found === undefined) {
      const known = phases.map((phase) => phase.name).join(', ');
      return err(`unknown phase "${wanted}", expected one of ${known}`);
    }
    const reason = excluded(found);
    if (reason !== undefined) return err(`phase "${wanted}" is excluded by ${reason}`);
    return ok([found]);
  }
  return ok(phases.filter((phase) => excluded(phase) === undefined));
}

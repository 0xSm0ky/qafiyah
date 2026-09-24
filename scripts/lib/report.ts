type ReportInput = {
  readonly title: string;
  readonly lines: readonly string[];
  readonly rule?: readonly string[];
  readonly ok: string;
};

export function reportViolations(input: ReportInput): number {
  if (input.lines.length === 0) {
    console.log(input.ok);
    return 0;
  }
  console.error(`${input.title}\n`);
  for (const line of input.lines) console.error(`  ${line}`);
  if (input.rule) console.error(['', ...input.rule, ''].join('\n'));
  return 1;
}

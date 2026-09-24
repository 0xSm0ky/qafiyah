type SnapshotInput = {
  readonly out: string;
  readonly rendered: string;
  readonly summary: string;
  readonly remedy: readonly string[];
  readonly check: boolean;
};

export async function snapshot(input: SnapshotInput): Promise<number> {
  if (!input.check) {
    await Bun.write(input.out, input.rendered);
    console.log(`wrote ${input.out} (${input.summary})`);
    return 0;
  }
  const current = await Bun.file(input.out)
    .text()
    .catch(() => '');
  if (current !== input.rendered) {
    console.error([`${input.out} is out of date.`, '', ...input.remedy, ''].join('\n'));
    return 1;
  }
  console.log(`${input.out} is current: ${input.summary}.`);
  return 0;
}

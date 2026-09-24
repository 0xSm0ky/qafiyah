export async function detectOrbStack(cwd: string): Promise<boolean> {
  const proc = Bun.spawn(['docker', 'info', '--format', '{{.OperatingSystem}}'], {
    cwd,
    env: process.env,
    stdout: 'pipe',
    stderr: 'ignore',
  });
  const text = await new Response(proc.stdout).text();
  return (await proc.exited) === 0 && text.trim().startsWith('OrbStack');
}

const MAD_SCALE = 1.4826;
const OUTLIER_THRESHOLD = 3;

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

export function coefficientOfVariation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function madOutlierShare(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const centre = median(values);
  const deviation = median(values.map((value) => Math.abs(value - centre))) || 1;
  const outliers = values.filter(
    (value) => Math.abs(value - centre) / (MAD_SCALE * deviation) > OUTLIER_THRESHOLD
  );
  return outliers.length / values.length;
}

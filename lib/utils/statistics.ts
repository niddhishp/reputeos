// lib/utils/statistics.ts
/**
 * Calculate standard deviation of an array of numbers
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate mean average
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate coefficient of variation (CV)
 */
export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return standardDeviation(values) / m;
}
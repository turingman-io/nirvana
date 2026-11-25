import { type ValueRange, type XYSeries } from './types2';

/** Point size used when neither a size field nor a fixed size is configured */
export const DEFAULT_POINT_SIZE = 5;

/** Smallest and largest point size used when a size field is mapped without its own min/max */
export const DEFAULT_POINT_SIZE_MIN = 5;
export const DEFAULT_POINT_SIZE_MAX = 100;

/**
 * Point diameters (in CSS pixels) for every row of a series.
 *
 * When a size field is mapped, its values are placed within `sizeRange` (the range across all series, so a value
 * is drawn at the same size in every series) and mapped to the series' min/max point size by area, not by diameter.
 */
export function getPointDiameters(series: XYSeries, sizeRange: ValueRange): number[] {
  const count = series.x.field.values.length;
  const { field, min, max, fixed } = series.size;

  if (field == null) {
    return Array(count).fill(fixed);
  }

  const minArea = min! ** 2;
  const areaRange = max! ** 2 - minArea;
  const valueRange = sizeRange.max - sizeRange.min;
  const diameters: number[] = Array(count);

  for (let i = 0; i < field.values.length; i++) {
    const pct = (field.values[i] - sizeRange.min) / valueRange;
    diameters[i] = (minArea + pct * areaRange) ** 0.5;
  }

  return diameters;
}

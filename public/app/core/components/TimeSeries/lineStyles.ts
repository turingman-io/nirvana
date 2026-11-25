import { type LineStyle } from '@grafana/schema';

/**
 * Distinct line styles cycled per series when the "accessible" line style is selected.
 * 9 patterns to maximize distinguishable series before repeats.
 */
const ALTERNATING_PATTERN_LINE_STYLES: LineStyle[] = [
  { fill: 'solid' },
  { fill: 'dash', dash: [10, 10] },
  { fill: 'dash', dash: [20, 10] },
  { fill: 'dash', dash: [30, 3, 3] },
  { fill: 'dash', dash: [10, 5, 3, 5] },
  { fill: 'dash', dash: [5, 5] },
  { fill: 'dash', dash: [20, 5, 5, 5] },
  { fill: 'dash', dash: [15, 10, 5, 10] },
  { fill: 'dash', dash: [30, 10] },
];

/**
 * Resolves the "accessible" (alternating patterns) fill type into a concrete line style per series.
 * Non accessible line styles pass through unchanged.
 */
export function resolveLineStyle(lineStyle: LineStyle | undefined, seriesIndex: number): LineStyle | undefined {
  if (!lineStyle || lineStyle.fill !== 'accessible') {
    return lineStyle;
  }
  return ALTERNATING_PATTERN_LINE_STYLES[seriesIndex % ALTERNATING_PATTERN_LINE_STYLES.length];
}

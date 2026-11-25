import tinycolor from 'tinycolor2';

import { FALLBACK_COLOR, FieldColorModeId, type FieldDisplay, type GrafanaTheme2 } from '@grafana/data';

import { filterDisplayItems } from './utils';

/**
 * Flat fill colors for the slices that use the "gradient" color scheme, keyed by `FieldDisplay`
 * object reference. The panel computes them once and passes the same map to the chart and the
 * legend, so both use the same rank order and the same interpolated hex values.
 *
 * Items are grouped by their (fixedColor, gradientColorTo) gradient config.
 * This handles three cases uniformly:
 *   1. Panel default = Gradient → all non-overridden items share one group.
 *   2. Per-field gradient override (e.g. byType, byRegexp) → items sharing
 *      the same override colors form their own group and are ranked together.
 *   3. Non-gradient items (fixed color, palette, etc.) → skipped entirely,
 *      fall back to display.color in the arc renderer.
 *
 * @returns undefined when no visible slice uses the gradient color scheme.
 */
export function getGradientFills(
  fieldDisplayValues: FieldDisplay[],
  theme: GrafanaTheme2
): Map<FieldDisplay, string> | undefined {
  const allGradientFills = new Map<FieldDisplay, string>();
  const gradientGroups = new Map<string, { items: FieldDisplay[]; from: string; to: string }>();

  for (const item of fieldDisplayValues) {
    if (!filterDisplayItems(item)) {
      continue;
    }
    if (item.field.color?.mode !== FieldColorModeId.Gradient) {
      continue;
    }
    const fixedColor = item.field.color.fixedColor ?? '#73BF69';
    const gradientColorTo = item.field.color.gradientColorTo ?? '#F2495C';
    const key = `${fixedColor}|${gradientColorTo}`;
    let group = gradientGroups.get(key);
    if (!group) {
      group = {
        items: [],
        from: theme.visualization.getColorByName(fixedColor),
        to: theme.visualization.getColorByName(gradientColorTo),
      };
      gradientGroups.set(key, group);
    }
    group.items.push(item);
  }

  for (const { items, from, to } of gradientGroups.values()) {
    for (const [item, color] of computeGradientFills(items, from, to)) {
      allGradientFills.set(item, color);
    }
  }

  return allGradientFills.size > 0 ? allGradientFills : undefined;
}

/**
 * Compute a flat hex fill color for each slice when the "gradient" color scheme is active.
 *
 * Slices are ranked by their numeric value from largest (rank 0) to smallest
 * (rank N-1). The interpolation parameter t = rank / (N-1) linearly maps that
 * rank onto the [colorFrom, colorTo] range in RGB space:
 *   - largest slice  → colorFrom (t = 0)
 *   - smallest slice → colorTo   (t = 1)
 *   - intermediate   → RGB lerp between the two
 *
 * When there is only one slice it receives colorFrom exactly.
 * Duplicate values retain their relative order (stable sort).
 *
 * @returns A Map keyed by the `FieldDisplay` object reference → hex color string.
 *   Using the object reference as the key (instead of display.title) guarantees
 *   uniqueness even when multiple series share the same display name.
 */
export function computeGradientFills(
  items: FieldDisplay[],
  colorFrom: string,
  colorTo: string
): Map<FieldDisplay, string> {
  // Sort a copy by value descending to determine rank; original order is unchanged.
  const sorted = [...items].sort((a, b) => b.display.numeric - a.display.numeric);
  const n = sorted.length;
  const from = tinycolor(colorFrom).toRgb();
  const to = tinycolor(colorTo).toRgb();
  const fills = new Map<FieldDisplay, string>();

  for (let rank = 0; rank < n; rank++) {
    const item = sorted[rank];
    const t = n > 1 ? rank / (n - 1) : 0;
    const r = Math.round(from.r * (1 - t) + to.r * t);
    const g = Math.round(from.g * (1 - t) + to.g * t);
    const b = Math.round(from.b * (1 - t) + to.b * t);
    fills.set(item, tinycolor({ r, g, b }).toHexString());
  }

  return fills;
}

/**
 * Solid color of a slice: its gradient fill when it has one, otherwise its display color.
 * Used for legend and tooltip swatches, and for the arcs while gradient fills are active.
 */
export function getSliceColor(item: FieldDisplay, gradientFills?: Map<FieldDisplay, string>): string {
  return gradientFills?.get(item) ?? item.display.color ?? FALLBACK_COLOR;
}

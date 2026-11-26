import { type FieldColorMode, type GrafanaTheme2 } from '@grafana/data';

// Space left between the blocks of a palette, so each color reads as a separate swatch
const PALETTE_GAP = '1px';

/**
 * Returns a CSS background that previews the colors of a color scheme: a smooth gradient for continuous
 * schemes, and one block per color for palettes. Returns undefined for modes without a fixed set of colors,
 * such as single color or thresholds.
 */
export function getColorSchemeBackground(theme: GrafanaTheme2, mode: FieldColorMode): string | undefined {
  const colors = mode.getColors?.(theme).map(theme.visualization.getColorByName);

  if (!colors?.length) {
    return undefined;
  }

  if (mode.isContinuous) {
    return `linear-gradient(90deg, ${colors.join(', ')})`;
  }

  const blockWidth = 100 / colors.length;
  const stops = colors.map((color, index) => {
    const start = index * blockWidth;
    const end = (index + 1) * blockWidth;

    if (index === colors.length - 1) {
      return `${color} ${start}% ${end}%`;
    }

    return `${color} ${start}% calc(${end}% - ${PALETTE_GAP}), transparent calc(${end}% - ${PALETTE_GAP}) ${end}%`;
  });

  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

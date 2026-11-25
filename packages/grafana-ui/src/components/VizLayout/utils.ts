import { type CSSProperties } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { type LegendPlacement } from '@grafana/schema';

import { type VizLayoutLegendLayoutProps, type VizSize } from './types';

const DEFAULT_LEGEND_MAX_HEIGHT = '35%';
const DEFAULT_LEGEND_MAX_WIDTH = '60%';

const flexDirectionByPlacement: Record<LegendPlacement, CSSProperties['flexDirection']> = {
  bottom: 'column',
  right: 'row',
};

/**
 * VizLayout always puts the legend at the bottom on viewports narrower than the `lg` breakpoint.
 * Legend content that renders differently per placement can use this to follow the placement VizLayout uses.
 *
 * @internal
 */
export function getVizLayoutLegendPlacement(placement: LegendPlacement, theme: GrafanaTheme2): LegendPlacement {
  if (document.body.clientWidth < theme.breakpoints.values.lg) {
    return 'bottom';
  }

  return placement;
}

export function getLegendFlexDirection(placement: LegendPlacement): CSSProperties['flexDirection'] {
  return flexDirectionByPlacement[placement];
}

export function getLegendStyle(placement: LegendPlacement, legend: VizLayoutLegendLayoutProps): CSSProperties {
  const { maxHeight = DEFAULT_LEGEND_MAX_HEIGHT, maxWidth = DEFAULT_LEGEND_MAX_WIDTH, width } = legend;

  switch (placement) {
    case 'bottom':
      return { maxHeight };
    case 'right':
      // a css width (e.g. '35%') is applied as is, without the maxWidth cap
      if (typeof width === 'string') {
        return { width };
      }

      return { maxWidth, width };
  }
}

/**
 * Size left for the visualization next to the legend, or `null` while the space the legend takes is not known yet.
 */
export function getVizSize(
  { width, height }: VizSize,
  placement: LegendPlacement,
  legend: VizLayoutLegendLayoutProps,
  legendSize: VizSize
): VizSize | null {
  switch (placement) {
    case 'bottom':
      if (legendSize.height) {
        return { width, height: getRemainingSpace(height, legendSize.height) };
      }

      return null;
    case 'right':
      if (typeof legend.width === 'number') {
        return { width: getRemainingSpace(width, legend.width), height };
      }

      if (legendSize.width) {
        return { width: getRemainingSpace(width, legendSize.width), height };
      }

      return null;
  }
}

function getRemainingSpace(space: number, legendSpace: number): number {
  const remaining = space - legendSpace;

  // The legend takes all of the space for one render cycle after it is switched from bottom to right placement,
  // until it is measured in its new position. Keep the full size meanwhile.
  return remaining === 0 ? space : remaining;
}

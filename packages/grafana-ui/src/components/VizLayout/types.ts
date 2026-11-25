import { type CSSProperties } from 'react';

import { type LegendPlacement } from '@grafana/schema';

/**
 * The props VizLayout reads from its `legend` element to place and size the legend. Legend components
 * that are passed to VizLayout directly (e.g. PlotLegend) accept them as well as VizLayout.Legend.
 *
 * @beta
 */
export interface VizLayoutLegendLayoutProps {
  placement: LegendPlacement;
  /** Max height of a bottom legend, as a css value. Defaults to `35%`. */
  maxHeight?: string;
  /** Max width of a right legend, as a css value. Defaults to `60%`. */
  maxWidth?: string;
  /** Width of a right legend, in pixels or as a css value (e.g. `35%`). A css value is not capped by `maxWidth`. */
  width?: number | string;
}

/**
 * @internal
 */
export interface VizSize {
  width: number;
  height: number;
}

/**
 * Where VizLayout puts the legend and how much room that leaves for the visualization.
 *
 * @internal
 */
export interface VizLayoutLegendLayout {
  /** Placement after the narrow viewport fallback has been applied */
  placement: LegendPlacement;
  flexDirection: CSSProperties['flexDirection'];
  legendStyle: CSSProperties;
  /** Size available to the visualization, or `null` while it is not known yet */
  vizSize: VizSize | null;
}

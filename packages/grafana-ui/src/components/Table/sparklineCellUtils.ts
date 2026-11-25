import {
  type DisplayValueAlignmentFactors,
  type FieldConfig,
  type FieldSparkline,
  formattedValueToString,
  getMinMaxAndDelta,
  type GrafanaTheme2,
  type TimeRange,
} from '@grafana/data';
import {
  BarAlignment,
  GraphDrawStyle,
  type GraphFieldConfig,
  GraphGradientMode,
  LineInterpolation,
  TableCellDisplayMode,
  type TableSparklineCellOptions,
  VisibilityMode,
} from '@grafana/schema';

import { measureText } from '../../utils/measureText';

import { type TableCellOptions } from './types';

/**
 * Default options for sparkline cells, shared by both table implementations and the sparkline cell options editor.
 */
export const defaultSparklineCellConfig: TableSparklineCellOptions = {
  type: TableCellDisplayMode.Sparkline,
  drawStyle: GraphDrawStyle.Line,
  lineInterpolation: LineInterpolation.Smooth,
  lineWidth: 1,
  fillOpacity: 17,
  gradientMode: GraphGradientMode.Hue,
  pointSize: 2,
  barAlignment: BarAlignment.Center,
  showPoints: VisibilityMode.Never,
  hideValue: false,
};

/**
 * @internal
 * Returns the sparkline options of a cell. Auto cells render time series frames as sparklines, so their options are
 * read as sparkline options.
 */
export function getSparklineCellOptions(cellOptions: TableCellOptions): TableSparklineCellOptions {
  if (cellOptions.type === TableCellDisplayMode.Auto) {
    return { ...cellOptions, type: TableCellDisplayMode.Sparkline };
  }
  if (cellOptions.type === TableCellDisplayMode.Sparkline) {
    return cellOptions;
  }
  throw new Error(`Expected options type ${TableCellDisplayMode.Sparkline} but got ${cellOptions.type}`);
}

/**
 * @internal
 * Prepares a cell's sparkline for drawing. The sparkline is updated in place.
 */
export function prepareSparklineForCell(sparkline: FieldSparkline, timeRange?: TimeRange): void {
  // Get the step from the first two values to null-fill the x-axis based on timerange
  if (sparkline.x && !sparkline.x.config.interval && sparkline.x.values.length > 1) {
    sparkline.x.config.interval = sparkline.x.values[1] - sparkline.x.values[0];
  }

  // Remove non-finite values, e.g: NaN, +/-Infinity
  sparkline.y.values = sparkline.y.values.map((v) => {
    if (!Number.isFinite(v)) {
      return null;
    } else {
      return v;
    }
  });

  const range = getMinMaxAndDelta(sparkline.y);
  sparkline.y.config.min = range.min;
  sparkline.y.config.max = range.max;
  sparkline.y.state = { range };
  sparkline.timeRange = timeRange;
}

/**
 * @internal
 * Returns the field config for the Sparkline of a cell. The cell options, applied over the defaults, are used as the
 * graph's custom config.
 */
export function getSparklineCellFieldConfig(
  { color }: FieldConfig,
  cellOptions: TableSparklineCellOptions
): FieldConfig<GraphFieldConfig> {
  return {
    color,
    custom: {
      ...defaultSparklineCellConfig,
      ...cellOptions,
    },
  };
}

/**
 * @internal
 * Returns the width reserved for the value shown next to a cell's sparkline, so that the sparklines of a column line up.
 */
export function getSparklineCellValueWidth(
  alignmentFactors: DisplayValueAlignmentFactors,
  theme: GrafanaTheme2
): number {
  return measureText(formattedValueToString(alignmentFactors), 16).width + theme.spacing.gridSize;
}

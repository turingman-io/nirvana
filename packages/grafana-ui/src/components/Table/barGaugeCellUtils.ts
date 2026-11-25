import {
  type Field,
  type FieldConfig,
  getFieldConfigWithMinMax,
  type ThresholdsConfig,
  ThresholdsMode,
} from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeValueMode, TableCellDisplayMode } from '@grafana/schema';

import { type TableCellOptions } from './types';

/**
 * @internal
 * Thresholds used by gauge cells whose field has none.
 */
export const defaultBarGaugeCellThresholds: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    {
      color: 'blue',
      value: -Infinity,
    },
    {
      color: 'green',
      value: 20,
    },
  ],
};

/**
 * @internal
 * Returns the field config for the BarGauge of a cell: the field's config with its min and max resolved, using the
 * default thresholds when the field has none.
 */
export function getBarGaugeCellFieldConfig(field: Field): FieldConfig {
  const config = getFieldConfigWithMinMax(field, false);
  if (config.thresholds) {
    return config;
  }

  return {
    ...config,
    thresholds: defaultBarGaugeCellThresholds,
  };
}

/** @internal */
export interface BarGaugeCellDisplayModes {
  displayMode: BarGaugeDisplayMode;
  valueDisplayMode?: BarGaugeValueMode;
}

/**
 * @internal
 * Returns the display and value modes for the BarGauge of a cell. Gauge cells default to a gradient bar with the value
 * shown in the text color.
 */
export function getBarGaugeCellDisplayModes(cellOptions: TableCellOptions): BarGaugeCellDisplayModes {
  if (cellOptions.type !== TableCellDisplayMode.Gauge) {
    return { displayMode: BarGaugeDisplayMode.Gradient };
  }

  return {
    displayMode: cellOptions.mode ?? BarGaugeDisplayMode.Gradient,
    valueDisplayMode:
      cellOptions.valueDisplayMode !== undefined ? cellOptions.valueDisplayMode : BarGaugeValueMode.Text,
  };
}

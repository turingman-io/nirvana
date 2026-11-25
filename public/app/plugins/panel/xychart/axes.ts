import { type Field, FieldType, formattedValueToString, type GrafanaTheme2 } from '@grafana/data';
import { AxisPlacement, ScaleDirection, ScaleOrientation } from '@grafana/schema';
import { type UPlotConfigBuilder } from '@grafana/ui';

import { type XYSeries } from './types2';
import { getCommonPrefixSuffix, getFieldName } from './utils';

/**
 * Adds the x scale and axis shared by all series, configured from the x field of the first series
 */
export function addXAxis(builder: UPlotConfigBuilder, xySeries: XYSeries[], theme: GrafanaTheme2) {
  const field = xySeries[0].x.field;
  const isTime = field.type === FieldType.time;
  const { config } = field;
  const customConfig = config.custom;
  const scaleDistr = customConfig?.scaleDistribution;

  builder.addScale({
    scaleKey: 'x',
    isTime,
    auto: true,
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    distribution: scaleDistr?.type,
    log: scaleDistr?.log,
    linearThreshold: scaleDistr?.linearThreshold,
    min: config.min,
    max: config.max,
    softMin: customConfig?.axisSoftMin,
    softMax: customConfig?.axisSoftMax,
    centeredZero: customConfig?.axisCenteredZero,
    decimals: config.decimals,
    range: isTime ? (u, min, max) => [min, max] : undefined,
  });

  builder.addAxis({
    scaleKey: 'x',
    isTime,
    placement: customConfig?.axisPlacement !== AxisPlacement.Hidden ? AxisPlacement.Bottom : AxisPlacement.Hidden,
    show: customConfig?.axisPlacement !== AxisPlacement.Hidden,
    grid: { show: customConfig?.axisGridShow },
    border: { show: customConfig?.axisBorderShow },
    theme,
    label: getAxisLabel(
      field,
      xySeries.map((s) => s.x.field)
    ),
    formatValue: isTime ? undefined : (v, decimals) => formattedValueToString(field.display!(v, decimals)),
  });
}

/**
 * Adds the y scale and axis of one series and returns the scale key. Series with the same unit share a scale.
 */
export function addYAxis(
  builder: UPlotConfigBuilder,
  series: XYSeries,
  xySeries: XYSeries[],
  theme: GrafanaTheme2
): string {
  const field = series.y.field;
  const { config } = field;
  const customConfig = config.custom;
  const scaleDistr = customConfig?.scaleDistribution;
  const scaleKey = config.unit ?? 'y';

  builder.addScale({
    scaleKey,
    orientation: ScaleOrientation.Vertical,
    direction: ScaleDirection.Up,
    distribution: scaleDistr?.type,
    log: scaleDistr?.log,
    linearThreshold: scaleDistr?.linearThreshold,
    min: config.min,
    max: config.max,
    softMin: customConfig?.axisSoftMin,
    softMax: customConfig?.axisSoftMax,
    centeredZero: customConfig?.axisCenteredZero,
    decimals: config.decimals,
  });

  builder.addAxis({
    scaleKey,
    theme,
    placement: customConfig?.axisPlacement === AxisPlacement.Auto ? AxisPlacement.Left : customConfig?.axisPlacement,
    show: customConfig?.axisPlacement !== AxisPlacement.Hidden,
    grid: { show: customConfig?.axisGridShow },
    border: { show: customConfig?.axisBorderShow },
    size: customConfig?.axisWidth,
    label: getAxisLabel(
      field,
      xySeries.map((s) => s.y.field)
    ),
    formatValue: (v, decimals) => formattedValueToString(field.display!(v, decimals)),
  });

  return scaleKey;
}

/**
 * The axis label set in the field config. Without one, the label is the field's name for a single series, or
 * else the display name shared by the fields on that axis (or the words common to all of them).
 */
export function getAxisLabel(field: Field, axisFields: Field[]): string | undefined {
  // why does this fall back to '' instead of null or undef?
  let label = field.config.custom.axisLabel;

  if (label == null || label === '') {
    const dispNames = axisFields.map((f) => f.state?.displayName ?? '');

    const autoLabel =
      axisFields.length === 1
        ? getFieldName(field)
        : new Set(dispNames).size === 1
          ? dispNames[0]
          : getCommonPrefixSuffix(dispNames);

    if (autoLabel !== '') {
      label = autoLabel;
    }
  }

  return label;
}

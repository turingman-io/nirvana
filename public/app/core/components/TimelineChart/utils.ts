import {
  type DataFrame,
  FALLBACK_COLOR,
  type Field,
  FieldColorModeId,
  type FieldConfig,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  getValueFormat,
  type GrafanaTheme2,
  getActiveThreshold,
  type Threshold,
  getFieldConfigWithMinMax,
  ThresholdsMode,
  type TimeRange,
  cacheFieldDisplayNames,
  outerJoinDataFrames,
  type ValueMapping,
  type ThresholdsConfig,
  applyNullInsertThreshold,
  nullToValue,
  SpecialValueMatch,
} from '@grafana/data';
import { maybeSortFrame, NULL_RETAIN } from '@grafana/data/internal';
import { t } from '@grafana/i18n';
import { type VizLegendOptions, AxisPlacement, ScaleDirection, ScaleOrientation, MappingType } from '@grafana/schema';
import { FIXED_UNIT, UPlotConfigBuilder, type UPlotConfigPrepFn, type VizLegendItem } from '@grafana/ui';
import { preparePlotData2, getStackingGroups, shouldShowLegend } from '@grafana/ui/internal';
import { findFrameWithNullTimeValue } from 'app/features/panel/frames/validation';

import { getConfig, type TimelineCoreOptions } from './timeline';
import { type PanelFieldConfig, type UPlotConfigOptions } from './types';

const defaultConfig: PanelFieldConfig = {
  lineWidth: 0,
  fillOpacity: 80,
};

/** Checks if a mapped value of the specified type exists for the given field */
export const hasSpecialMappedValue = (field: Field, match: SpecialValueMatch): boolean =>
  field.config.mappings?.some(
    (mapping: ValueMapping): boolean => mapping.type === MappingType.SpecialValue && mapping.options.match === match
  ) || false;

export const preparePlotConfigBuilder: UPlotConfigPrepFn<UPlotConfigOptions> = ({
  frame,
  theme,
  timeZones,
  getTimeRange,
  mode,
  rowHeight,
  colWidth,
  showValue,
  alignValue,
  mergeValues,
  getValueColor,
  hoverMulti,
  xAxisConfig,
}) => {
  const builder = new UPlotConfigBuilder(timeZones[0]);

  const xScaleKey = 'x';

  const isDiscrete = (field: Field) => {
    const mode = field.config?.color?.mode;
    return !(mode && field.display && mode.startsWith('continuous-'));
  };
  const getValueColorFn = (seriesIdx: number, value: unknown) => {
    const field = frame.fields[seriesIdx];

    if (
      field.state?.origin?.fieldIndex !== undefined &&
      field.state?.origin?.frameIndex !== undefined &&
      getValueColor
    ) {
      return getValueColor(field.state?.origin?.frameIndex, field.state?.origin?.fieldIndex, value);
    }

    return FALLBACK_COLOR;
  };

  const opts: TimelineCoreOptions = {
    mode: mode!,
    numSeries: frame.fields.length - 1,
    isDiscrete: (seriesIdx) => isDiscrete(frame.fields[seriesIdx]),
    hasMappedNull: (seriesIdx) =>
      hasSpecialMappedValue(frame.fields[seriesIdx], SpecialValueMatch.Null) ||
      hasSpecialMappedValue(frame.fields[seriesIdx], SpecialValueMatch.NullAndNaN),
    hasMappedNaN: (seriesIdx) =>
      hasSpecialMappedValue(frame.fields[seriesIdx], SpecialValueMatch.NaN) ||
      hasSpecialMappedValue(frame.fields[seriesIdx], SpecialValueMatch.NullAndNaN),
    mergeValues,
    rowHeight: rowHeight,
    colWidth: colWidth,
    showValue: showValue!,
    alignValue,
    theme,
    label: (seriesIdx) => getFieldDisplayName(frame.fields[seriesIdx], frame),
    getFieldConfig: (seriesIdx) => frame.fields[seriesIdx].config.custom,
    getValueColor: getValueColorFn,
    getTimeRange,
    // hardcoded formatter for state values
    formatValue: (seriesIdx, value) => formattedValueToString(frame.fields[seriesIdx].display!(value)),
    hoverMulti,
  };

  const coreConfig = getConfig(opts);

  builder.addHook('init', coreConfig.init);
  builder.addHook('drawClear', coreConfig.drawClear);

  builder.setPrepData((frames) => preparePlotData2(frames[0], getStackingGroups(frames[0])));

  builder.setCursor(coreConfig.cursor);

  builder.addScale({
    scaleKey: xScaleKey,
    isTime: true,
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    range: (u) => {
      const state = builder.getState();
      if (state.isPanning) {
        if (state.isTimeRangePending) {
          const propsRange = coreConfig.xRange(u);
          const propsFrom = propsRange[0];
          const propsTo = propsRange[1];

          if (propsFrom != null && propsTo != null) {
            const MIN_TIMESPAN_MS = 1;
            const fromMatches = Math.abs(propsFrom - state.min) <= MIN_TIMESPAN_MS;
            const toMatches = Math.abs(propsTo - state.max) <= MIN_TIMESPAN_MS;
            const timeRangeHasUpdated = fromMatches && toMatches;

            if (timeRangeHasUpdated) {
              builder.setState({ isPanning: false });
              return propsRange;
            }
          }
        }

        return [state.min, state.max];
      }
      return coreConfig.xRange(u);
    },
  });

  builder.addScale({
    scaleKey: FIXED_UNIT, // y
    isTime: false,
    orientation: ScaleOrientation.Vertical,
    direction: ScaleDirection.Up,
    range: coreConfig.yRange,
  });

  const xField = frame.fields[0];
  const xAxisHidden = xField.config.custom?.axisPlacement === AxisPlacement.Hidden;

  builder.addAxis({
    show: !xAxisHidden,
    scaleKey: xScaleKey,
    isTime: true,
    splits: coreConfig.xSplits!,
    placement: AxisPlacement.Bottom,
    timeZone: timeZones[0],
    theme,
    formatValue: xField.config.unit?.startsWith('time:')
      ? (v, decimals) => xField.display!(v, decimals).text
      : undefined,
    ...xAxisConfig,
  });

  const yCustomConfig = frame.fields[1].config.custom;
  const yAxisWidth = yCustomConfig.axisWidth;
  const yAxisHidden = yCustomConfig.axisPlacement === AxisPlacement.Hidden;

  builder.addAxis({
    scaleKey: FIXED_UNIT, // y
    isTime: false,
    placement: AxisPlacement.Left,
    splits: coreConfig.ySplits,
    values: yAxisHidden ? (u, splits) => splits.map((v) => null) : coreConfig.yValues,
    grid: { show: false },
    ticks: { show: false },
    gap: yAxisHidden ? 0 : 16,
    size: yAxisHidden ? 0 : yAxisWidth,
    theme,
  });

  let seriesIndex = 0;

  for (let i = 0; i < frame.fields.length; i++) {
    if (i === 0) {
      continue;
    }

    const field = frame.fields[i];
    const config: FieldConfig<PanelFieldConfig> = field.config;
    const customConfig: PanelFieldConfig = {
      ...defaultConfig,
      ...config.custom,
    };

    field.state!.seriesIndex = seriesIndex++;

    // const scaleKey = config.unit || FIXED_UNIT;
    // const colorMode = getFieldColorModeForField(field);

    builder.addSeries({
      scaleKey: FIXED_UNIT,
      pathBuilder: coreConfig.drawPaths,
      pointsBuilder: coreConfig.drawPoints,
      //colorMode,
      lineWidth: customConfig.lineWidth,
      fillOpacity: customConfig.fillOpacity,
      theme,
      show: !customConfig.hideFrom?.viz,
      thresholds: config.thresholds,
      // The following properties are not used in the uPlot config, but are utilized as transport for legend config
      dataFrameFieldIndex: field.state?.origin,
    });
  }

  return builder;
};

function getSpanNulls(field: Field) {
  let spanNulls = field.config.custom?.spanNulls;

  // magic value for join() to leave nulls alone instead of expanding null ranges
  // should be set to -1 when spanNulls = null|undefined|false|0, which is "retain nulls, without expanding"
  // Infinity is not optimal here since it causes spanNulls to be more expensive than simply removing all nulls unconditionally
  return !spanNulls ? -1 : spanNulls === true ? Infinity : spanNulls;
}

/**
 * Merge values by the threshold
 */
function mergeThresholdValues(field: Field, theme: GrafanaTheme2): Field | undefined {
  const thresholds = field.config.thresholds;
  if (field.type !== FieldType.number || !thresholds || !thresholds.steps.length) {
    return undefined;
  }

  const items = getThresholdItems(field.config, theme);
  if (items.length !== thresholds.steps.length) {
    return undefined; // should not happen
  }

  const thresholdToText = new Map<Threshold, string>();
  const textToColor = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    thresholdToText.set(thresholds.steps[i], items[i].label);
    textToColor.set(items[i].label, items[i].color!);
  }

  let input = field.values;
  const vals = new Array<String | undefined>(field.values.length);
  if (thresholds.mode === ThresholdsMode.Percentage) {
    const { min, max } = getFieldConfigWithMinMax(field);
    const delta = max! - min!;
    input = input.map((v) => {
      if (v == null) {
        return v;
      }
      return ((v - min!) / delta) * 100;
    });
  }

  for (let i = 0; i < vals.length; i++) {
    const v = input[i];
    if (v == null) {
      vals[i] = v;
    } else {
      vals[i] = thresholdToText.get(getActiveThreshold(v, thresholds.steps));
    }
  }

  return {
    ...field,
    config: {
      ...field.config,
      custom: {
        ...field.config.custom,
        spanNulls: getSpanNulls(field),
      },
    },
    type: FieldType.string,
    values: vals,
    display: (value) => ({
      text: String(value),
      color: textToColor.get(String(value)),
      numeric: NaN,
    }),
  };
}

/**
 * Finds the first two time fields with numeric values: the state start times and, when the frame has them,
 * the state end times. A missing field has index -1.
 */
function findStateTimeFields(frame: DataFrame): { startFieldIdx: number; endFieldIdx: number } {
  let startFieldIdx = -1;
  let endFieldIdx = -1;

  for (let i = 0; i < frame.fields.length; i++) {
    const f = frame.fields[i];

    if (f.type === FieldType.time && typeof f.values[0] === 'number') {
      if (startFieldIdx === -1) {
        startFieldIdx = i;
      } else if (endFieldIdx === -1) {
        endFieldIdx = i;
        break;
      }
    }
  }

  return { startFieldIdx, endFieldIdx };
}

/**
 * Outer joins the state end times into the frame's time field, with null values at the end times.
 */
function joinStateEndTimes(frame: DataFrame, endFieldIdx: number): DataFrame {
  const startFrame: DataFrame = {
    ...frame,
    fields: frame.fields.filter((f, i) => i !== endFieldIdx),
  };

  const endFrame: DataFrame = {
    length: frame.length,
    fields: [frame.fields[endFieldIdx]],
  };

  const joined = outerJoinDataFrames({
    frames: [startFrame, endFrame],
    keepDisplayNames: true,
    nullMode: () => NULL_RETAIN,
  })!;

  joined.fields.forEach((f, i) => {
    if (i > 0) {
      const vals = f.values;
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] == null) {
          vals[i] = null;
        }
      }
    }
  });

  return joined;
}

/**
 * Returns the field the way the timeline graphs it, or undefined when fields of its type can't be graphed.
 */
function prepareValueField(field: Field, mergeValues: boolean, theme: GrafanaTheme2): Field | undefined {
  switch (field.type) {
    case FieldType.enum:
    case FieldType.number:
      if (mergeValues && field.config.color?.mode === FieldColorModeId.Thresholds) {
        const merged = mergeThresholdValues(field, theme);
        if (merged) {
          return merged;
        }
      }

    case FieldType.boolean:
    case FieldType.string:
      return {
        ...field,
        config: {
          ...field.config,
          custom: {
            ...field.config.custom,
            spanNulls: getSpanNulls(field),
          },
        },
      };
    default:
      return undefined;
  }
}

interface PreparedTimelineFrame {
  /** Only set when the frame has a time field and at least one field that can be graphed */
  frame?: DataFrame;
  /** Whether the frame has a time field with numeric values */
  hasTimeField: boolean;
}

/**
 * Sorts a frame by time, joins its state end times, inserts nulls by the null threshold and keeps only
 * the fields the timeline can graph.
 */
function prepareTimelineFrame(
  frame: DataFrame,
  mergeValues: boolean,
  timeRange: TimeRange,
  theme: GrafanaTheme2
): PreparedTimelineFrame {
  const { startFieldIdx, endFieldIdx } = findStateTimeFields(frame);

  let isTimeseries = startFieldIdx !== -1;
  let hasTimeField = false;
  let changed = false;
  frame = maybeSortFrame(frame, startFieldIdx);

  // if we have a second time field, assume it is state end timestamps
  // and insert nulls into the data at the end timestamps
  if (endFieldIdx !== -1) {
    frame = joinStateEndTimes(frame, endFieldIdx);
    changed = true;
  }

  const nulledFrame = applyNullInsertThreshold({
    frame,
    refFieldPseudoMin: timeRange.from.valueOf(),
    refFieldPseudoMax: timeRange.to.valueOf(),
  });

  if (nulledFrame !== frame) {
    changed = true;
  }

  frame = nullToValue(nulledFrame);

  const fields: Field[] = [];
  for (const field of frame.fields) {
    if (field.type === FieldType.time) {
      if (typeof field.values[0] === 'number') {
        isTimeseries = true;
        hasTimeField = true;
        fields.push(field);
      }
      continue;
    }

    const valueField = prepareValueField(field, mergeValues, theme);
    if (valueField) {
      fields.push(valueField);
    }
    changed = true;
  }

  if (!isTimeseries || fields.length < 2) {
    return { hasTimeField };
  }

  return {
    frame: changed ? { ...frame, fields } : frame,
    hasTimeField: true,
  };
}

// This will return a set of frames with only graphable values included
export function prepareTimelineFields(
  series: DataFrame[] | undefined,
  mergeValues: boolean,
  timeRange: TimeRange,
  theme: GrafanaTheme2
): { frames?: DataFrame[]; warn?: string } {
  // this allows PanelDataErrorView to show the default noValue message
  if (!series?.length) {
    return { warn: '' };
  }

  cacheFieldDisplayNames(series);

  let hasTimeseries = false;
  const frames: DataFrame[] = [];

  for (const frame of series) {
    const prepared = prepareTimelineFrame(frame, mergeValues, timeRange, theme);

    if (prepared.hasTimeField) {
      hasTimeseries = true;
    }
    if (prepared.frame) {
      frames.push(prepared.frame);
    }
  }

  if (!hasTimeseries) {
    return { warn: t('timeline.missing-field.time', 'Data does not have a time field') };
  }
  if (!frames.length) {
    return { warn: t('timeline.missing-field.all', 'No graphable fields') };
  }

  const invalidFrame = findFrameWithNullTimeValue(frames);
  if (invalidFrame) {
    return {
      warn: invalidFrame.refId
        ? t(
            'timeseries.time-series-panel.null-time-value-query',
            'Query {{refId}} returned a time field with null values; filter out rows with empty timestamps',
            { refId: invalidFrame.refId }
          )
        : t(
            'timeseries.time-series-panel.null-time-value',
            'A query returned a time field with null values; filter out rows with empty timestamps'
          ),
    };
  }

  return { frames };
}

export function makeFramePerSeries(frames: DataFrame[]) {
  const outFrames: DataFrame[] = [];

  for (let frame of frames) {
    const timeFields = frame.fields.filter((field) => field.type === FieldType.time);

    if (timeFields.length > 0) {
      for (let field of frame.fields) {
        if (field.type !== FieldType.time) {
          outFrames.push({ fields: [...timeFields, field], length: frame.length });
        }
      }
    }
  }

  return outFrames;
}

export function getThresholdItems(
  fieldConfig: FieldConfig,
  theme: GrafanaTheme2,
  thresholdItems?: ThresholdsConfig
): VizLegendItem[] {
  const items: VizLegendItem[] = [];
  const thresholds = thresholdItems ? thresholdItems : fieldConfig.thresholds;
  if (!thresholds || !thresholds.steps.length) {
    return items;
  }

  const steps = thresholds.steps;
  const getDisplay = getValueFormat(
    thresholds.mode === ThresholdsMode.Percentage ? 'percent' : (fieldConfig.unit ?? '')
  );

  // `undefined` value for decimals will use `auto`
  const format = (value: number) => formattedValueToString(getDisplay(value, fieldConfig.decimals ?? undefined));

  for (let i = 0; i < steps.length; i++) {
    let step = steps[i];
    let value = step.value;
    let pre = '';
    let suf = '';

    if (value === -Infinity && i < steps.length - 1) {
      value = steps[i + 1].value;
      pre = '< ';
    } else {
      suf = '+';
    }

    items.push({
      label: `${pre}${format(value)}${suf}`,
      color: theme.visualization.getColorByName(step.color),
      yAxis: 1,
    });
  }

  return items;
}

export function getValueMappingItems(mappings: ValueMapping[], theme: GrafanaTheme2): VizLegendItem[] {
  const items: VizLegendItem[] = [];
  if (!mappings) {
    return items;
  }

  for (let mapping of mappings) {
    const { options, type } = mapping;

    if (type === MappingType.ValueToText) {
      for (let [label, value] of Object.entries(options)) {
        const color = value.color;
        items.push({
          label: label,
          color: theme.visualization.getColorByName(color ?? FALLBACK_COLOR),
          yAxis: 1,
        });
      }
    }

    if (type === MappingType.RangeToText) {
      const { from, result, to } = options;
      const { text, color } = result;
      const label = text ? `[${from} - ${to}] ${text}` : `[${from} - ${to}]`;

      items.push({
        label: label,
        color: theme.visualization.getColorByName(color ?? FALLBACK_COLOR),
        yAxis: 1,
      });
    }

    if (type === MappingType.RegexToText) {
      const { pattern, result } = options;
      const { text, color } = result;
      const label = `${text || pattern}`;

      items.push({
        label: label,
        color: theme.visualization.getColorByName(color ?? FALLBACK_COLOR),
        yAxis: 1,
      });
    }

    if (type === MappingType.SpecialValue) {
      const { match, result } = options;
      const { text, color } = result;
      const label = `${text || match}`;

      items.push({
        label: label,
        color: theme.visualization.getColorByName(color ?? FALLBACK_COLOR),
        yAxis: 1,
      });
    }
  }

  return items;
}

export function prepareTimelineLegendItems(
  frames: DataFrame[] | undefined,
  options: VizLegendOptions,
  theme: GrafanaTheme2
): VizLegendItem[] | undefined {
  if (!frames || !shouldShowLegend(options)) {
    return undefined;
  }

  return getFieldLegendItem(allNonTimeFields(frames), theme);
}

function getFieldLegendItem(fields: Field[], theme: GrafanaTheme2): VizLegendItem[] | undefined {
  if (!fields.length) {
    return undefined;
  }

  const items: VizLegendItem[] = [];
  const fieldConfig = fields[0].config;
  const colorMode = fieldConfig.color?.mode ?? FieldColorModeId.Fixed;
  const thresholds = fieldConfig.thresholds;

  // If thresholds are enabled show each step in the legend
  // This ignores the hide from legend since the range is valid
  if (colorMode === FieldColorModeId.Thresholds && thresholds?.steps && thresholds.steps.length > 1) {
    return getThresholdItems(fieldConfig, theme);
  }

  // If thresholds are enabled show each step in the legend
  if (colorMode.startsWith('continuous')) {
    return undefined; // eventually a color bar
  }

  const stateColors: Map<string, string | undefined> = new Map();

  fields.forEach((field) => {
    if (!field.config.custom?.hideFrom?.legend) {
      field.values.forEach((v) => {
        let state = field.display!(v);
        if (state.color) {
          stateColors.set(state.text, state.color!);
        }
      });
    }
  });

  stateColors.forEach((color, label) => {
    if (label.length > 0) {
      items.push({
        label: label!,
        color: theme.visualization.getColorByName(color ?? FALLBACK_COLOR),
        yAxis: 1,
      });
    }
  });

  return items;
}

function allNonTimeFields(frames: DataFrame[]): Field[] {
  const fields: Field[] = [];
  for (const frame of frames) {
    for (const field of frame.fields) {
      if (field.type !== FieldType.time) {
        fields.push(field);
      }
    }
  }
  return fields;
}

export function findNextStateIndex(field: Field, datapointIdx: number) {
  let end;
  let rightPointer = datapointIdx + 1;

  if (rightPointer >= field.values.length) {
    return null;
  }

  const startValue = field.values[datapointIdx];

  while (end === undefined) {
    if (rightPointer >= field.values.length) {
      return null;
    }
    const rightValue = field.values[rightPointer];

    if (rightValue === undefined || rightValue === startValue) {
      rightPointer++;
    } else {
      end = rightPointer;
    }
  }

  return end;
}

/**
 * Returns when the state at `dataIdx` ends: when the next state starts, or at the end of the time range for the
 * last state.
 */
export function getStateEndTime(xField: Field, field: Field, dataIdx: number, timeRange: TimeRange): number {
  const nextStateIdx = findNextStateIndex(field, dataIdx);
  const nextStateTs = nextStateIdx != null ? xField.values[nextStateIdx] : undefined;

  return nextStateTs || timeRange.to.valueOf();
}

/**
 * Returns the precise duration of a time range passed in milliseconds.
 * This function calculates with 30 days month and 365 days year.
 * adapted from https://gist.github.com/remino/1563878
 * @param milliSeconds The duration in milliseconds
 * @returns A formatted string of the duration
 */
export function fmtDuration(milliSeconds: number): string {
  if (milliSeconds < 0 || Number.isNaN(milliSeconds)) {
    return '';
  }

  let yr: number, mo: number, wk: number, d: number, h: number, m: number, s: number, ms: number;

  s = Math.floor(milliSeconds / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  yr = Math.floor(d / 365);
  if (yr > 0) {
    d = d % 365;
  }

  mo = Math.floor(d / 30);
  if (mo > 0) {
    d = d % 30;
  }

  wk = Math.floor(d / 7);

  if (wk > 0) {
    d = d % 7;
  }

  ms = Math.round((milliSeconds % 1000) * 1000) / 1000;

  return (
    yr > 0
      ? yr + 'y ' + (mo > 0 ? mo + 'mo ' : '') + (wk > 0 ? wk + 'w ' : '') + (d > 0 ? d + 'd ' : '')
      : mo > 0
        ? mo + 'mo ' + (wk > 0 ? wk + 'w ' : '') + (d > 0 ? d + 'd ' : '')
        : wk > 0
          ? wk + 'w ' + (d > 0 ? d + 'd ' : '')
          : d > 0
            ? d + 'd ' + (h > 0 ? h + 'h ' : '')
            : h > 0
              ? h + 'h ' + (m > 0 ? m + 'm ' : '')
              : m > 0
                ? m + 'm ' + (s > 0 ? s + 's ' : '')
                : s > 0
                  ? s + 's ' + (ms > 0 ? ms + 'ms ' : '')
                  : ms > 0
                    ? ms + 'ms '
                    : '0'
  ).trim();
}

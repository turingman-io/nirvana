import { createTheme, dateTime, type FieldSparkline, FieldType } from '@grafana/data';
import { GraphDrawStyle, TableCellDisplayMode, type TableSparklineCellOptions } from '@grafana/schema';

import { measureText } from '../../utils/measureText';

import {
  defaultSparklineCellConfig,
  getSparklineCellFieldConfig,
  getSparklineCellOptions,
  getSparklineCellValueWidth,
  prepareSparklineForCell,
} from './sparklineCellUtils';

jest.mock('../../utils/measureText', () => ({
  measureText: jest.fn(() => ({ width: 30 })),
}));

const getSparkline = (): FieldSparkline => ({
  x: { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000], config: {} },
  y: { name: 'value', type: FieldType.number, values: [1, NaN, 5, -Infinity], config: {} },
});

describe('getSparklineCellOptions', () => {
  it('returns sparkline options as they are', () => {
    const options: TableSparklineCellOptions = { type: TableCellDisplayMode.Sparkline, lineWidth: 2 };
    expect(getSparklineCellOptions(options)).toBe(options);
  });

  it('reads auto cell options as sparkline options', () => {
    expect(getSparklineCellOptions({ type: TableCellDisplayMode.Auto })).toEqual({
      type: TableCellDisplayMode.Sparkline,
    });
  });

  it('throws for other cell types', () => {
    expect(() => getSparklineCellOptions({ type: TableCellDisplayMode.Gauge })).toThrow(
      'Expected options type sparkline but got gauge'
    );
  });
});

describe('prepareSparklineForCell', () => {
  it('infers the x interval from the first two values', () => {
    const sparkline = getSparkline();
    prepareSparklineForCell(sparkline);
    expect(sparkline.x?.config.interval).toBe(1000);
  });

  it('keeps an interval that is already set', () => {
    const sparkline = getSparkline();
    sparkline.x!.config.interval = 500;
    prepareSparklineForCell(sparkline);
    expect(sparkline.x?.config.interval).toBe(500);
  });

  it('replaces non-finite values and sets the range from the others', () => {
    const sparkline = getSparkline();
    prepareSparklineForCell(sparkline);
    expect(sparkline.y.values).toEqual([1, null, 5, null]);
    expect(sparkline.y.config).toMatchObject({ min: 1, max: 5 });
    expect(sparkline.y.state?.range).toEqual({ min: 1, max: 5, delta: 4 });
  });

  it('sets the time range', () => {
    const sparkline = getSparkline();
    const timeRange = { from: dateTime(1000), to: dateTime(4000), raw: { from: 'now-1h', to: 'now' } };
    prepareSparklineForCell(sparkline, timeRange);
    expect(sparkline.timeRange).toBe(timeRange);
  });
});

describe('getSparklineCellFieldConfig', () => {
  it('applies the cell options over the defaults as the custom config', () => {
    const config = getSparklineCellFieldConfig(
      {},
      { type: TableCellDisplayMode.Sparkline, drawStyle: GraphDrawStyle.Bars, lineWidth: 3 }
    );
    expect(config.custom).toEqual({ ...defaultSparklineCellConfig, drawStyle: GraphDrawStyle.Bars, lineWidth: 3 });
  });
});

describe('getSparklineCellValueWidth', () => {
  it('measures the formatted value and adds a grid unit', () => {
    const theme = createTheme();
    expect(getSparklineCellValueWidth({ prefix: '$', text: '1.5', suffix: 'k' }, theme)).toBe(
      30 + theme.spacing.gridSize
    );
    expect(measureText).toHaveBeenCalledWith('$1.5k', 16);
  });
});

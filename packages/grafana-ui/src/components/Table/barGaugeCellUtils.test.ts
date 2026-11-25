import { type Field, FieldType, ThresholdsMode } from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeValueMode, TableCellDisplayMode } from '@grafana/schema';

import {
  defaultBarGaugeCellThresholds,
  getBarGaugeCellDisplayModes,
  getBarGaugeCellFieldConfig,
} from './barGaugeCellUtils';

const getField = (config: Field['config'] = {}): Field => ({
  name: 'value',
  type: FieldType.number,
  values: [5, 10, 40],
  config,
});

describe('getBarGaugeCellFieldConfig', () => {
  it('resolves the min and max from the values', () => {
    expect(getBarGaugeCellFieldConfig(getField())).toMatchObject({ min: 5, max: 40 });
  });

  it('keeps the thresholds of the field', () => {
    const thresholds = { mode: ThresholdsMode.Percentage, steps: [{ value: -Infinity, color: 'red' }] };
    expect(getBarGaugeCellFieldConfig(getField({ thresholds })).thresholds).toBe(thresholds);
  });

  it('uses the default thresholds when the field has none', () => {
    expect(getBarGaugeCellFieldConfig(getField()).thresholds).toBe(defaultBarGaugeCellThresholds);
  });
});

describe('getBarGaugeCellDisplayModes', () => {
  it('defaults to a gradient gauge with the value in the text color', () => {
    expect(getBarGaugeCellDisplayModes({ type: TableCellDisplayMode.Gauge })).toEqual({
      displayMode: BarGaugeDisplayMode.Gradient,
      valueDisplayMode: BarGaugeValueMode.Text,
    });
  });

  it('uses the modes from the cell options', () => {
    expect(
      getBarGaugeCellDisplayModes({
        type: TableCellDisplayMode.Gauge,
        mode: BarGaugeDisplayMode.Lcd,
        valueDisplayMode: BarGaugeValueMode.Hidden,
      })
    ).toEqual({ displayMode: BarGaugeDisplayMode.Lcd, valueDisplayMode: BarGaugeValueMode.Hidden });
  });

  it('leaves the value mode unset for other cell types', () => {
    expect(getBarGaugeCellDisplayModes({ type: TableCellDisplayMode.Auto })).toEqual({
      displayMode: BarGaugeDisplayMode.Gradient,
    });
  });
});

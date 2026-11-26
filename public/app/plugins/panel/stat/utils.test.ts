import { createDataFrame, DataFrameView, type FieldDisplay, type FieldDTO, FieldType } from '@grafana/data';

import { getLastUpdatedTime } from './utils';

function getFieldDisplay(fields: FieldDTO[], overrides: Partial<FieldDisplay> = {}): FieldDisplay {
  const view = new DataFrameView(createDataFrame({ fields }));

  return {
    name: 'value',
    field: {},
    display: { numeric: 0, text: '0' },
    hasLinks: false,
    view,
    colIndex: 1,
    ...overrides,
  };
}

describe('getLastUpdatedTime', () => {
  it('returns the time of the last value', () => {
    const value = getFieldDisplay([
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
      { name: 'value', type: FieldType.number, values: [1, 2, 3] },
    ]);

    expect(getLastUpdatedTime(value)).toBe(3000);
  });

  it('skips trailing null values', () => {
    const value = getFieldDisplay([
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
      { name: 'value', type: FieldType.number, values: [1, 2, null] },
    ]);

    expect(getLastUpdatedTime(value)).toBe(2000);
  });

  it('returns the time of the row when showing all values', () => {
    const value = getFieldDisplay(
      [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
        { name: 'value', type: FieldType.number, values: [1, 2, 3] },
      ],
      { rowIndex: 0 }
    );

    expect(getLastUpdatedTime(value)).toBe(1000);
  });

  it('returns undefined when the frame has no time field', () => {
    const value = getFieldDisplay(
      [
        { name: 'value', type: FieldType.number, values: [1, 2, 3] },
        { name: 'other', type: FieldType.number, values: [4, 5, 6] },
      ],
      { colIndex: 0 }
    );

    expect(getLastUpdatedTime(value)).toBeUndefined();
  });

  it('returns undefined when the value is not backed by a frame', () => {
    expect(getLastUpdatedTime(getFieldDisplay([], { view: undefined, colIndex: undefined }))).toBeUndefined();
  });
});

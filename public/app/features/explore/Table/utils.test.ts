import { type DataFrame, FieldType, toDataFrame } from '@grafana/data';

import { getNonEmptyFrames, getTableHeight, getTableTitle, hasSubFrames } from './utils';

function makeFrame(overrides: Partial<DataFrame> = {}, values: number[] = [1, 2]): DataFrame {
  return {
    ...toDataFrame({ fields: [{ name: 'value', type: FieldType.number, values }] }),
    ...overrides,
  };
}

describe('getTableHeight', () => {
  it('uses a fixed height when there are no rows', () => {
    expect(getTableHeight(0, false, false)).toBe(200);
  });

  it('keeps a minimum height of 300', () => {
    expect(getTableHeight(2, false, false)).toBe(300);
  });

  it('has no minimum height while the query is streaming', () => {
    expect(getTableHeight(2, false, true)).toBe(2 * 36 + 40 + 46);
  });

  it('caps the height at 600', () => {
    expect(getTableHeight(1000, false, false)).toBe(600);
  });

  it('reserves room for nested frames', () => {
    expect(getTableHeight(1, true, true)).toBe(300 + 40 + 46);
  });
});

describe('hasSubFrames', () => {
  it('detects nested frames fields', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'value', type: FieldType.number, values: [1] },
        { name: 'nested', type: FieldType.nestedFrames, values: [[]] },
      ],
    });
    expect(hasSubFrames(frame)).toBe(true);
    expect(hasSubFrames(makeFrame())).toBe(false);
  });
});

describe('getTableTitle', () => {
  it('uses the frame name', () => {
    const frame = makeFrame({ name: 'metric{label="value"}' });
    expect(getTableTitle([frame], frame, 0)).toBe('Table - metric{label="value"}');
  });

  it('falls back to a plain title for a single unnamed frame', () => {
    const frame = makeFrame({ refId: 'A' });
    expect(getTableTitle([frame], frame, 0)).toBe('Table');
  });

  it('names unnamed frames by refId, then position, when there are several', () => {
    const frameA = makeFrame({ refId: 'A' });
    const unnamed = makeFrame();
    expect(getTableTitle([frameA, unnamed], frameA, 0)).toBe('Table - A');
    expect(getTableTitle([frameA, unnamed], unnamed, 1)).toBe('Table - 1');
  });
});

describe('getNonEmptyFrames', () => {
  it('drops missing and empty frames', () => {
    const frame = makeFrame();
    const empty = makeFrame({}, []);
    expect(getNonEmptyFrames([frame, undefined, empty])).toEqual([frame]);
  });

  it('passes through a missing result', () => {
    expect(getNonEmptyFrames(null)).toBeUndefined();
  });
});

import { type FieldDisplay } from '@grafana/data';

import { formatPercentOfTotal, hasFrames } from './utils';

function makeItem(numeric: number, decimals?: number, frameLength?: number): FieldDisplay {
  return {
    display: { numeric, text: String(numeric) },
    field: { decimals },
    view: frameLength === undefined ? undefined : { dataFrame: { length: frameLength } },
  } as unknown as FieldDisplay;
}

describe('hasFrames', () => {
  it('is true when at least one item comes from a frame with rows', () => {
    expect(hasFrames([makeItem(1, undefined, 0), makeItem(2, undefined, 3)])).toBe(true);
  });

  it('is false when no item comes from a frame with rows', () => {
    expect(hasFrames([])).toBe(false);
    expect(hasFrames([makeItem(1), makeItem(2, undefined, 0)])).toBe(false);
  });
});

describe('formatPercentOfTotal', () => {
  it('rounds to whole percentages by default', () => {
    expect(formatPercentOfTotal(makeItem(1), 3)).toBe('33%');
  });

  it('uses the field decimals', () => {
    expect(formatPercentOfTotal(makeItem(1, 2), 3)).toBe('33.33%');
  });
});

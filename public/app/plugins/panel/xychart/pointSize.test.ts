import { createDataFrame, FieldType, type Field } from '@grafana/data';
import { VisibilityMode } from '@grafana/schema';

import { PointShape } from './panelcfg.gen';
import { getPointDiameters } from './pointSize';
import { type XYSeries } from './types2';

function makeField(name: string, values: number[], custom: Record<string, unknown> = {}): Field {
  return createDataFrame({
    fields: [{ name, type: FieldType.number, values, config: { custom } }],
  }).fields[0];
}

function makeSeries(size: XYSeries['size']): XYSeries {
  return {
    showPoints: VisibilityMode.Always,
    pointShape: PointShape.Circle,
    pointStrokeWidth: 1,
    fillOpacity: 50,
    showLine: false,
    lineWidth: 1,
    lineStyle: { fill: 'solid' },
    name: { value: 'A' },
    x: { field: makeField('x', [1, 2, 3]) },
    y: { field: makeField('y', [10, 20, 30], { pointSize: { fixed: 8 } }) },
    color: { fixed: '#ff0000' },
    size,
    _rest: [],
  };
}

describe('getPointDiameters', () => {
  it('uses the fixed size for every point when no size field is mapped', () => {
    const series = makeSeries({ fixed: 7 });

    expect(getPointDiameters(series, { min: Infinity, max: -Infinity })).toEqual([7, 7, 7]);
  });

  it('maps the size range to the min/max point size by area', () => {
    const series = makeSeries({ field: makeField('size', [0, 50, 100]), min: 2, max: 10 });
    const diameters = getPointDiameters(series, { min: 0, max: 100 });

    expect(diameters[0]).toBeCloseTo(2);
    expect(diameters[1]).toBeCloseTo(Math.sqrt((2 ** 2 + 10 ** 2) / 2));
    expect(diameters[2]).toBeCloseTo(10);
  });

  it('places values within the given range rather than the range of the series itself', () => {
    const series = makeSeries({ field: makeField('size', [20, 40, 60]), min: 4, max: 12 });
    const diameters = getPointDiameters(series, { min: 20, max: 100 });

    expect(diameters[0]).toBeCloseTo(4);
    expect(diameters[1]).toBeCloseTo(Math.sqrt(4 ** 2 + 0.25 * (12 ** 2 - 4 ** 2)));
    expect(diameters[2]).toBeCloseTo(Math.sqrt(4 ** 2 + 0.5 * (12 ** 2 - 4 ** 2)));
  });
});

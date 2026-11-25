import { createDataFrame, createTheme, FieldType, type Field } from '@grafana/data';
import { AxisPlacement, VisibilityMode } from '@grafana/schema';
import { UPlotConfigBuilder } from '@grafana/ui';

import { addXAxis, addYAxis, getAxisLabel } from './axes';
import { PointShape } from './panelcfg.gen';
import { type XYSeries } from './types2';

const theme = createTheme();

function makeField(
  name: string,
  opts: { type?: FieldType; displayName?: string; config?: Record<string, unknown> } = {}
): Field {
  const { type = FieldType.number, displayName, config = {} } = opts;
  const field = createDataFrame({
    fields: [{ name, type, values: [1, 2, 3], config: { custom: { axisLabel: '' }, ...config } }],
  }).fields[0];

  if (displayName != null) {
    field.state = { displayName };
  }

  return field;
}

function makeSeries(x: Field, y: Field): XYSeries {
  return {
    showPoints: VisibilityMode.Always,
    pointShape: PointShape.Circle,
    pointStrokeWidth: 1,
    fillOpacity: 50,
    showLine: false,
    lineWidth: 1,
    lineStyle: { fill: 'solid' },
    name: { value: y.name },
    x: { field: x },
    y: { field: y },
    color: { fixed: '#ff0000' },
    size: { fixed: 5 },
    _rest: [],
  };
}

describe('getAxisLabel', () => {
  it('uses the axis label from the field config', () => {
    const field = makeField('y', { displayName: 'Temperature', config: { custom: { axisLabel: 'Celsius' } } });

    expect(getAxisLabel(field, [field])).toBe('Celsius');
  });

  it('uses the display name, or else the name, of a single field', () => {
    const named = makeField('temp');
    const displayed = makeField('temp', { displayName: 'Temperature' });

    expect(getAxisLabel(named, [named])).toBe('temp');
    expect(getAxisLabel(displayed, [displayed])).toBe('Temperature');
  });

  it('uses the display name shared by the fields on the axis, or the words they have in common', () => {
    const a = makeField('a', { displayName: 'cpu usage A' });
    const b = makeField('b', { displayName: 'cpu usage B' });
    const c = makeField('c', { displayName: 'cpu usage B' });

    expect(getAxisLabel(b, [a, b])).toBe('cpu usage');
    expect(getAxisLabel(b, [b, c])).toBe('cpu usage B');
  });
});

describe('addXAxis', () => {
  it('adds a time scale and axis for a time field', () => {
    const builder = new UPlotConfigBuilder();
    const addScale = jest.spyOn(builder, 'addScale');
    const addAxis = jest.spyOn(builder, 'addAxis');

    addXAxis(builder, [makeSeries(makeField('time', { type: FieldType.time }), makeField('y'))], theme);

    expect(addScale).toHaveBeenCalledWith(expect.objectContaining({ scaleKey: 'x', isTime: true }));
    expect(addAxis).toHaveBeenCalledWith(
      expect.objectContaining({ scaleKey: 'x', isTime: true, label: 'time', formatValue: undefined })
    );
  });
});

describe('addYAxis', () => {
  it('uses the unit of the field as the scale key and places auto axes on the left', () => {
    const builder = new UPlotConfigBuilder();
    const x = makeField('x');
    const custom = { axisLabel: '', axisPlacement: AxisPlacement.Auto };
    const xySeries = [
      makeSeries(x, makeField('a', { config: { unit: 'percent', custom } })),
      makeSeries(x, makeField('b', { config: { unit: 'bytes', custom } })),
    ];

    const scaleKeys = xySeries.map((series) => addYAxis(builder, series, xySeries, theme));

    expect(scaleKeys).toEqual(['percent', 'bytes']);
    expect(scaleKeys.map((key) => builder.getAxisPlacement(key))).toEqual([AxisPlacement.Left, AxisPlacement.Left]);
  });
});

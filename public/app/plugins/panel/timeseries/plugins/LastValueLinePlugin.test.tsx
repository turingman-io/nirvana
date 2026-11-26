import { act, render } from '@testing-library/react';
import type uPlot from 'uplot';

import { createDataFrame, createTheme, type DataFrame, FieldType, getDisplayProcessor } from '@grafana/data';
import { type UPlotConfigBuilder } from '@grafana/ui';

import { getLastValueLines, LastValueLinePlugin } from './LastValueLinePlugin';

const theme = createTheme();

function createFrame(series: Record<string, Array<number | null>>, unit?: string): DataFrame {
  const frame = createDataFrame({
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000] },
      ...Object.entries(series).map(([name, values]) => ({ name, type: FieldType.number, values, config: { unit } })),
    ],
  });
  frame.fields.forEach((field) => (field.display = getDisplayProcessor({ field, theme })));
  return frame;
}

// y: 10px per unit from the bottom of a 100px high plot
function createPlot(frame: DataFrame, xMax = 4000): uPlot {
  return {
    data: frame.fields.map((field) => field.values),
    series: frame.fields.map((field, i) => ({ show: true, scale: i === 0 ? 'x' : 'y' })),
    scales: { x: { min: 1000, max: xMax } },
    valToPos: (val: number) => 100 - val * 10,
    bbox: { left: 0, top: 0, width: 300, height: 100 },
    under: document.createElement('div'),
  } as unknown as uPlot;
}

describe('getLastValueLines', () => {
  it('uses the last non-null value of each series within the x range', () => {
    const frame = createFrame({ a: [1, 2, 3, 4], b: [5, 6, null, null] });

    expect(getLastValueLines(createPlot(frame), frame, theme)).toEqual([
      expect.objectContaining({ text: '6', y: 40, tagY: 38 }),
      expect.objectContaining({ text: '4', y: 60, tagY: 58 }),
    ]);
    expect(getLastValueLines(createPlot(frame, 2500), frame, theme)[1]).toMatchObject({ text: '2', y: 80 });
  });

  it('skips hidden series and formats the value with the unit', () => {
    const frame = createFrame({ a: [1, 2, 3, 4], b: [1, 2, 3, 4.5] }, 'percent');
    const plot = createPlot(frame);
    plot.series[1].show = false;

    expect(getLastValueLines(plot, frame, theme)).toEqual([expect.objectContaining({ key: '2', text: '4.50%' })]);
  });

  it('stacks the tags of series that end close together', () => {
    const frame = createFrame({ a: [1, 2, 3, 5], b: [1, 2, 3, 5.5], c: [1, 2, 3, 1] });

    expect(getLastValueLines(createPlot(frame), frame, theme).map((line) => [line.y, line.tagY])).toEqual([
      [45, 43],
      [50, 61],
      [90, 88],
    ]);
  });
});

describe('LastValueLinePlugin', () => {
  it('renders a line and a value tag per series once the plot is drawn', () => {
    const hooks: Record<string, (u: uPlot) => void> = {};
    const config = {
      addHook: jest.fn((type, hook) => {
        hooks[type] = hook;
      }),
    } as unknown as UPlotConfigBuilder;
    const frame = createFrame({ 'A-series': [1, 2, 3, 4], 'B-series': [4, 3, 2, 1.5] });
    const plot = createPlot(frame);

    const { container } = render(<LastValueLinePlugin config={config} frame={frame} />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      hooks.init(plot);
      hooks.draw(plot);
    });

    expect(plot.under).toHaveTextContent('4');
    expect(plot.under).toHaveTextContent('1.50');
  });
});

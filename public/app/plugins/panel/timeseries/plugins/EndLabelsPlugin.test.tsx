import { act, render } from '@testing-library/react';
import type uPlot from 'uplot';

import { createDataFrame, createTheme, type DataFrame, FieldType, getDisplayProcessor } from '@grafana/data';
import { type UPlotConfigBuilder } from '@grafana/ui';

import { EndLabelsMode } from '../panelcfg.gen';

import { EndLabelsPlugin, getEndLabels } from './EndLabelsPlugin';

function createFrame(series: Record<string, Array<number | null>>, unit?: string): DataFrame {
  const frame = createDataFrame({
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000] },
      ...Object.entries(series).map(([name, values]) => ({ name, type: FieldType.number, values, config: { unit } })),
    ],
  });
  frame.fields.forEach((field) => (field.display = getDisplayProcessor({ field, theme: createTheme() })));
  return frame;
}

// x: 1px per 10ms from 1000, y: 10px per unit from the bottom of a 100px high plot
function createPlot(frame: DataFrame, xMax = 4000): uPlot {
  return {
    data: frame.fields.map((field) => field.values),
    series: frame.fields.map((field, i) => ({ show: true, scale: i === 0 ? 'x' : 'y' })),
    scales: { x: { min: 1000, max: xMax } },
    valToPos: (val: number, scaleKey: string) => (scaleKey === 'x' ? (val - 1000) / 10 : 100 - val * 10),
    bbox: { left: 0, top: 0, width: 300, height: 100 },
    under: document.createElement('div'),
  } as unknown as uPlot;
}

describe('getEndLabels', () => {
  it('anchors each label to the last non-null point within the x range', () => {
    const frame = createFrame({ a: [1, 2, 3, 4], b: [5, 6, null, null] });

    expect(getEndLabels(createPlot(frame), frame, EndLabelsMode.Name)).toEqual([
      expect.objectContaining({ text: 'b', x: 100, y: 36 }),
      expect.objectContaining({ text: 'a', x: 300, y: 56 }),
    ]);
    expect(getEndLabels(createPlot(frame, 2500), frame, EndLabelsMode.Name)[1]).toMatchObject({ x: 100, y: 76 });
  });

  it('skips hidden series and shows formatted values', () => {
    const frame = createFrame({ a: [1, 2, 3, 4], b: [1, 2, 3, 4.5] }, 'percent');
    const plot = createPlot(frame);
    plot.series[1].show = false;

    expect(getEndLabels(plot, frame, EndLabelsMode.Value)).toEqual([expect.objectContaining({ text: '4.50%' })]);
  });

  it('stacks labels that would overlap', () => {
    const frame = createFrame({ a: [1, 2, 3, 5], b: [1, 2, 3, 5.5], c: [1, 2, 3, 1] });

    expect(getEndLabels(createPlot(frame), frame, EndLabelsMode.Name).map((label) => [label.text, label.y])).toEqual([
      ['b', 41],
      ['a', 57],
      ['c', 86],
    ]);
  });
});

describe('EndLabelsPlugin', () => {
  it('renders the labels into the plot once it is drawn', () => {
    const hooks: Record<string, (u: uPlot) => void> = {};
    const config = {
      addHook: jest.fn((type, hook) => {
        hooks[type] = hook;
      }),
    } as unknown as UPlotConfigBuilder;
    const frame = createFrame({ 'A-series': [1, 2, 3, 4], 'B-series': [4, 3, 2, 1] });
    const plot = createPlot(frame);

    const { container } = render(<EndLabelsPlugin config={config} frame={frame} mode={EndLabelsMode.Name} />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      hooks.init(plot);
      hooks.draw(plot);
    });

    expect(plot.under).toHaveTextContent('A-series');
    expect(plot.under).toHaveTextContent('B-series');
  });
});

import { type FieldDisplay } from '@grafana/data';
import { type HideSeriesConfig } from '@grafana/schema';

import { getPieChartLegendItems } from './PieChartLegend';
import { PieChartLegendValues } from './panelcfg.gen';

function makeItem(title: string, numeric: number, hideFrom: Partial<HideSeriesConfig> = {}): FieldDisplay {
  return {
    name: title,
    display: { title, numeric, text: String(numeric), color: '#73bf69' },
    field: { custom: { hideFrom } },
    hasLinks: false,
  } as unknown as FieldDisplay;
}

describe('getPieChartLegendItems', () => {
  it('leaves out series hidden from the legend', () => {
    const items = getPieChartLegendItems({
      displayValues: [makeItem('Chrome', 60), makeItem('Firefox', 40, { legend: true })],
      values: [],
    });

    expect(items.map((item) => item.label)).toEqual(['Chrome']);
  });

  it('shows the value and the percentage of the visible total', () => {
    const [chrome] = getPieChartLegendItems({
      displayValues: [makeItem('Chrome', 60), makeItem('Firefox', 30), makeItem('Safari', 10, { viz: true })],
      values: [PieChartLegendValues.Value, PieChartLegendValues.Percent],
    });

    expect(chrome.getDisplayValues?.()).toEqual([
      { numeric: 60, text: '60', title: 'Value' },
      { numeric: 60 / 90, percent: (60 / 90) * 100, text: '67%', title: 'Percent' },
    ]);
  });

  it('disables series hidden from the chart and shows the no value text instead of a percentage', () => {
    const [, safari] = getPieChartLegendItems({
      displayValues: [makeItem('Chrome', 60), makeItem('Safari', 40, { viz: true })],
      values: [PieChartLegendValues.Percent],
      noValue: 'n/a',
    });

    expect(safari.disabled).toBe(true);
    expect(safari.getDisplayValues?.()).toEqual([{ numeric: 0, percent: 0, text: 'n/a', title: '' }]);
  });

  it('uses the gradient fill as the item color when the slice has one', () => {
    const chrome = makeItem('Chrome', 60);
    const firefox = makeItem('Firefox', 40);

    const items = getPieChartLegendItems({
      displayValues: [chrome, firefox],
      values: [],
      gradientFills: new Map([[chrome, '#00ff00']]),
    });

    expect(items.map((item) => item.color)).toEqual(['#00ff00', '#73bf69']);
  });
});

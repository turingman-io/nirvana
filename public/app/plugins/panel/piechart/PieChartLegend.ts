import { type DisplayValue, type FieldDisplay, formattedValueToString } from '@grafana/data';
import { type HideSeriesConfig } from '@grafana/schema';
import { type VizLegendItem } from '@grafana/ui';

import { getSliceColor } from './PieChartGradient';
import { PieChartLegendValues } from './panelcfg.gen';
import { filterDisplayItems, formatPercentOfTotal, sumDisplayItemsReducer } from './utils';

interface PieChartLegendItemsOptions {
  displayValues: FieldDisplay[];
  /** Values shown next to each item. */
  values: PieChartLegendValues[];
  gradientFills?: Map<FieldDisplay, string>;
  /** Shown instead of the percentage for series hidden from the chart or without a value. Defaults to '-'. */
  noValue?: string;
}

export function getPieChartLegendItems({
  displayValues,
  values,
  gradientFills,
  noValue,
}: PieChartLegendItemsOptions): VizLegendItem[] {
  const total = displayValues.filter(filterDisplayItems).reduce(sumDisplayItemsReducer, 0);

  return displayValues
    .map<VizLegendItem | undefined>((value: FieldDisplay, idx: number) => {
      const hideFrom: HideSeriesConfig = value.field.custom?.hideFrom ?? {};

      if (hideFrom.legend) {
        return undefined;
      }

      const hideFromViz = Boolean(hideFrom.viz);

      const display = value.display;
      return {
        label: display.title ?? '',
        color: getSliceColor(value, gradientFills),
        yAxis: 1,
        disabled: hideFromViz,
        getItemKey: () => (display.title ?? '') + idx,
        getDisplayValues: () => {
          const legendValues: DisplayValue[] = [];

          if (values.includes(PieChartLegendValues.Value)) {
            legendValues.push({ numeric: display.numeric, text: formattedValueToString(display), title: 'Value' });
          }

          if (values.includes(PieChartLegendValues.Percent)) {
            const fractionOfTotal = hideFromViz ? 0 : display.numeric / total;

            legendValues.push({
              numeric: fractionOfTotal,
              percent: fractionOfTotal * 100,
              text: hideFromViz || isNaN(fractionOfTotal) ? (noValue ?? '-') : formatPercentOfTotal(value, total),
              title: values.length > 1 ? 'Percent' : '',
            });
          }

          return legendValues;
        },
      };
    })
    .filter((i): i is VizLegendItem => !!i);
}

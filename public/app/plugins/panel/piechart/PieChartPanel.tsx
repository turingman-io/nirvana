import { type FieldDisplay, getFieldDisplayValues, type PanelProps } from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import { SortOrder, LegendDisplayMode } from '@grafana/schema';
import { SeriesVisibilityChangeBehavior, useTheme2, VizLayout, VizLegend } from '@grafana/ui';
import { shouldShowLegend } from '@grafana/ui/internal';

import { PieChart } from './PieChart';
import { getGradientFills } from './PieChartGradient';
import { getPieChartLegendItems } from './PieChartLegend';
import { type PieChartLegendOptions, PieChartLegendValues, type Options } from './panelcfg.gen';
import { useSliceHighlightState } from './useSliceHighlightState';
import { hasFrames } from './utils';

const defaultLegendOptions: PieChartLegendOptions = {
  displayMode: LegendDisplayMode.List,
  showLegend: true,
  placement: 'right',
  calcs: [],
  values: [PieChartLegendValues.Percent],
};

interface Props extends PanelProps<Options> {}

/**
 * @beta
 */
export function PieChartPanel(props: Props) {
  const { data, timeZone, fieldConfig, replaceVariables, width, height, options, id } = props;

  const theme = useTheme2();
  const highlightedTitle = useSliceHighlightState();
  const fieldDisplayValues = getFieldDisplayValues({
    fieldConfig,
    reduceOptions: options.reduceOptions,
    data: data.series,
    theme: theme,
    replaceVariables,
    timeZone,
  });

  if (!hasFrames(fieldDisplayValues)) {
    return <PanelDataErrorView panelId={id} fieldConfig={fieldConfig} data={data} />;
  }

  // Computed once here so the chart and the legend share the exact same color map.
  const gradientFills = getGradientFills(fieldDisplayValues, theme);

  return (
    <VizLayout width={width} height={height} legend={getLegend(props, fieldDisplayValues, gradientFills)}>
      {(vizWidth: number, vizHeight: number) => {
        return (
          <PieChart
            width={vizWidth}
            height={vizHeight}
            highlightedTitle={highlightedTitle}
            fieldDisplayValues={fieldDisplayValues}
            tooltipOptions={options.tooltip}
            pieType={options.pieType}
            sort={options.sort}
            displayLabels={options.displayLabels}
            gradientFills={gradientFills}
          />
        );
      }}
    </VizLayout>
  );
}

function getLegend(props: Props, displayValues: FieldDisplay[], gradientFills?: Map<FieldDisplay, string>) {
  const legendOptions = props.options.legend ?? defaultLegendOptions;

  if (!shouldShowLegend(legendOptions)) {
    return undefined;
  }

  const legendItems = getPieChartLegendItems({
    displayValues: displayValues.sort(comparePieChartItemsByValue(props.options.sort)),
    values: legendOptions.values ?? [],
    gradientFills,
    noValue: props.fieldConfig.defaults.noValue,
  });

  return (
    <VizLayout.Legend placement={legendOptions.placement} width={legendOptions.width}>
      <VizLegend
        items={legendItems}
        seriesVisibilityChangeBehavior={SeriesVisibilityChangeBehavior.Hide}
        placement={legendOptions.placement}
        displayMode={legendOptions.displayMode}
        overflow={legendOptions.overflow}
        limit={legendOptions.limit}
      />
    </VizLayout.Legend>
  );
}

export function comparePieChartItemsByValue(sort: SortOrder): (a: FieldDisplay, b: FieldDisplay) => number {
  return function (a: FieldDisplay, b: FieldDisplay) {
    if (isNaN(a.display.numeric)) {
      return 1;
    }
    if (isNaN(b.display.numeric)) {
      return -1;
    }

    if (sort === SortOrder.Descending) {
      return b.display.numeric - a.display.numeric;
    }
    if (sort === SortOrder.Ascending) {
      return a.display.numeric - b.display.numeric;
    }

    return 0;
  };
}

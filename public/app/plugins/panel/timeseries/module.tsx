import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';
import { commonOptionsBuilder } from '@grafana/ui';
import { optsWithHideZeros } from '@grafana/ui/internal';
import { addAnnotationOptions } from 'app/features/panel/options/builder/annotations';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { TimezonesEditor } from './TimezonesEditor';
import { defaultGraphConfig, getGraphFieldConfig } from './config';
import { graphPanelChangedHandler } from './migrations';
import { EndLabelsMode, type FieldConfig, type Options } from './panelcfg.gen';
import { timeseriesPresetsSupplier } from './presets';
import { timeseriesSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(TimeSeriesPanel)
  .setPanelChangeHandler(graphPanelChangedHandler)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder) => {
    commonOptionsBuilder.addTooltipOptions(builder, false, true, optsWithHideZeros);
    commonOptionsBuilder.addLegendOptions(builder, true, true);

    const legendCategory = [t('timeseries.legend.category', 'Legend')];

    builder.addBooleanSwitch({
      path: 'legend.enableFacetedFilter',
      name: t('timeseries.legend.name-faceted-filter', 'Series visibility'),
      category: legendCategory,
      description: t(
        'timeseries.legend.description-faceted-filter',
        'Enable filter to display series based on labels or names'
      ),
      showIf: (c) => c.legend.showLegend,
    });

    builder.addRadio({
      path: 'endLabels',
      name: t('timeseries.legend.name-end-labels', 'End labels'),
      category: legendCategory,
      description: t(
        'timeseries.legend.description-end-labels',
        'Label each series with its name or last value at the end of its line'
      ),
      defaultValue: EndLabelsMode.Off,
      settings: {
        options: [
          { value: EndLabelsMode.Off, label: t('timeseries.legend.end-labels-off', 'Off') },
          { value: EndLabelsMode.Name, label: t('timeseries.legend.end-labels-name', 'Name') },
          { value: EndLabelsMode.Value, label: t('timeseries.legend.end-labels-value', 'Value') },
        ],
      },
    });

    builder.addCustomEditor({
      id: 'timezone',
      name: t('timeseries.name-time-zone', 'Time zone'),
      path: 'timezone',
      category: [t('timeseries.category-axis', 'Axis')],
      editor: TimezonesEditor,
      defaultValue: undefined,
    });

    addAnnotationOptions(builder);
  })
  .setSuggestionsSupplier(timeseriesSuggestionsSupplier)
  .setPresetsSupplier(timeseriesPresetsSupplier)
  .setViewPanelOptions({
    fanout: { enabled: true },
    quickToggles: {
      optionProperties: ['legend.showLegend', 'legend.placement'],
      fieldConfigProperties: ['custom.stacking', 'custom.scaleDistribution'],
    },
  })
  .setDataSupport({ annotations: true, alertStates: true });

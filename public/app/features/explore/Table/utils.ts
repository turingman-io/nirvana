import {
  applyFieldOverrides,
  type DataFrame,
  type DataLinkPostProcessor,
  FieldType,
  type GrafanaTheme2,
  type TimeZone,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { getTemplateSrv } from '@grafana/runtime';

export const MAX_NUMBER_OF_COLUMNS = 20;

export function hasSubFrames(data: DataFrame) {
  return data.fields.some((f) => f.type === FieldType.nestedFrames);
}

export function getTableHeight(rowCount: number, hasSubFrames: boolean, queryStreaming: boolean) {
  if (rowCount === 0) {
    return 200;
  }
  // tries to estimate table height, with a min of 300 and a max of 600
  // if there are multiple tables, there is no min
  const height = Math.min(600, Math.max(rowCount * 36, hasSubFrames ? 300 : 0) + 40 + 46);

  if (queryStreaming) {
    return height;
  }
  // esure minimum height of 300
  return Math.max(height, 300);
}

export function getTableTitle(dataFrames: DataFrame[] | null, data: DataFrame, i: number) {
  let name = data.name;
  if (!name && (dataFrames?.length ?? 0) > 1) {
    name = data.refId || `${i}`;
  }

  return name
    ? t('explore.table.title-with-name', 'Table - {{name}}', { name, interpolation: { escapeValue: false } })
    : t('explore.table.title', 'Table');
}

export function getNonEmptyFrames(frames: Array<DataFrame | undefined> | null | undefined) {
  return frames?.filter((frame: DataFrame | undefined): frame is DataFrame => !!frame && frame.length !== 0);
}

/**
 * Hides the columns past MAX_NUMBER_OF_COLUMNS unless showAllColumns is set. Fields hidden by the
 * data source stay hidden either way. Returns whether the limit hid any column.
 */
export function applyColumnLimit(frames: DataFrame[], showAllColumns: boolean): boolean {
  let dataLimited = false;

  for (const frame of frames) {
    frame.fields.forEach((field, index) => {
      const custom = field.config.custom ?? {};

      const hiddenByColumnLimit = showAllColumns ? false : index >= MAX_NUMBER_OF_COLUMNS;
      dataLimited = dataLimited || hiddenByColumnLimit;

      const hiddenByDatasource = custom.hideFrom?.viz === true || custom.hidden === true;
      const hidden = hiddenByDatasource || hiddenByColumnLimit;

      field.config.custom = {
        ...custom,
        hidden,
        hideFrom: {
          ...custom.hideFrom,
          viz: hidden,
        },
      };
    });
  }

  return dataLimited;
}

interface TableFieldOverridesOptions {
  timeZone: TimeZone;
  theme: GrafanaTheme2;
  dataLinkPostProcessor?: DataLinkPostProcessor;
}

/**
 * Field overrides for tables rendered in Explore: there is no panel field config, so this mostly
 * sets up display processors, template variable interpolation and Explore's data links.
 */
export function applyTableFieldOverrides(
  frames: DataFrame[],
  { timeZone, theme, dataLinkPostProcessor }: TableFieldOverridesOptions
): DataFrame[] {
  return applyFieldOverrides({
    data: frames,
    timeZone,
    theme,
    replaceVariables: getTemplateSrv().replace.bind(getTemplateSrv()),
    fieldConfig: {
      defaults: {},
      overrides: [],
    },
    dataLinkPostProcessor,
  });
}

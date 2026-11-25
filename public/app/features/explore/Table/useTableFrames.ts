import { useMemo } from 'react';

import { type DataFrame, type DataLinkPostProcessor } from '@grafana/data';
import { type TimeZone } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import {
  hasDeprecatedParentRowIndex,
  migrateFromParentRowIndexToNestedFrames,
} from 'app/plugins/panel/table/migrations';

import { applyColumnLimit, applyTableFieldOverrides } from './utils';

interface Options {
  tableResult: DataFrame[] | null;
  showAllColumns: boolean;
  timeZone: TimeZone;
  dataLinkPostProcessor: DataLinkPostProcessor;
}

interface TableFrames {
  /** Frames ready to be rendered by the table panel, including empty ones */
  frames: DataFrame[] | null;
  /** Whether MAX_NUMBER_OF_COLUMNS hid any column */
  dataLimited: boolean;
}

/**
 * Prepares Explore's table result for the table panel: migrates frames that still use the
 * deprecated parentRowIndex, applies the column limit and the field overrides.
 */
export function useTableFrames({ tableResult, showAllColumns, timeZone, dataLinkPostProcessor }: Options): TableFrames {
  const theme = useTheme2();

  return useMemo(() => {
    const frames = hasDeprecatedParentRowIndex(tableResult)
      ? migrateFromParentRowIndexToNestedFrames(tableResult)
      : tableResult;

    if (!frames?.length) {
      return { frames, dataLimited: false };
    }

    const dataLimited = applyColumnLimit(frames, showAllColumns);
    const preparedFrames = applyTableFieldOverrides(frames, { timeZone, theme, dataLinkPostProcessor });

    return { frames: preparedFrames, dataLimited };
  }, [tableResult, showAllColumns, timeZone, theme, dataLinkPostProcessor]);
}

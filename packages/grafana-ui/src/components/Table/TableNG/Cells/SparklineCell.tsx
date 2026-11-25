import { css } from '@emotion/css';
import { memoize } from 'micro-memoize';
import * as React from 'react';

import { isDataFrameWithValue } from '@grafana/data';
import { t } from '@grafana/i18n';

import { FormattedValueDisplay } from '../../../FormattedValueDisplay/FormattedValueDisplay';
import { Sparkline } from '../../../Sparkline/Sparkline';
import {
  getSparklineCellFieldConfig,
  getSparklineCellOptions,
  getSparklineCellValueWidth,
  prepareSparklineForCell,
} from '../../sparklineCellUtils';
import { MaybeWrapWithLink } from '../components/MaybeWrapWithLink';
import { isTableCellStylesKeyEqual } from '../styles';
import { type SparklineCellProps, type TableCellStyles } from '../types';
import { getAlignmentFactor, getCellOptions, prepareSparklineValue } from '../utils';

export const SparklineCell = (props: SparklineCellProps) => {
  const { field, value, theme, timeRange, rowIdx, width } = props;
  const sparkline = prepareSparklineValue(value, field);

  if (!sparkline) {
    return (
      <MaybeWrapWithLink field={field} rowIdx={rowIdx}>
        {field.config.noValue || t('grafana-ui.table.sparkline.no-data', 'no data')}
      </MaybeWrapWithLink>
    );
  }

  prepareSparklineForCell(sparkline, timeRange);

  const cellOptions = getSparklineCellOptions(getCellOptions(field));
  const config = getSparklineCellFieldConfig(field.config, cellOptions);

  const hideValue = cellOptions.hideValue;
  let valueWidth = 0;
  let valueElement: React.ReactNode = null;
  if (!hideValue) {
    const newValue = isDataFrameWithValue(value) ? value.value : null;
    const displayValue = field.display!(newValue);
    const alignmentFactor = getAlignmentFactor(field, displayValue, rowIdx!);

    valueWidth = getSparklineCellValueWidth(alignmentFactor, theme);

    valueElement = <FormattedValueDisplay style={{ width: valueWidth }} value={displayValue} />;
  }

  return (
    <MaybeWrapWithLink field={field} rowIdx={rowIdx}>
      {valueElement}
      <Sparkline
        width={width - valueWidth}
        height={25}
        sparkline={sparkline}
        config={config}
        theme={theme}
        showTooltip={cellOptions.showTooltip}
      />
    </MaybeWrapWithLink>
  );
};

export const getStyles: TableCellStyles = memoize(
  (theme, { textAlign }) =>
    css({
      '&, & > a': {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
        ...(textAlign === 'right' && { flexDirection: 'row-reverse' }),
      },
    }),
  { isKeyEqual: isTableCellStylesKeyEqual }
);

import * as React from 'react';

import { FieldType, type FieldSparkline, isDataFrame, isDataFrameWithValue } from '@grafana/data';

import { useTheme2 } from '../../../themes/ThemeContext';
import { FormattedValueDisplay } from '../../FormattedValueDisplay/FormattedValueDisplay';
import { Sparkline } from '../../Sparkline/Sparkline';
import { getAlignmentFactor, getCellOptions } from '../cellUtils';
import {
  getSparklineCellFieldConfig,
  getSparklineCellOptions,
  getSparklineCellValueWidth,
  prepareSparklineForCell,
} from '../sparklineCellUtils';
import { type TableCellProps } from '../types';

export const SparklineCell = (props: TableCellProps) => {
  const { field, innerWidth, tableStyles, cell, cellProps, timeRange } = props;
  const sparkline = getSparkline(cell.value);
  const theme = useTheme2();

  if (!sparkline) {
    return (
      <div {...cellProps} className={tableStyles.cellContainer}>
        {field.config.noValue || 'no data'}
      </div>
    );
  }

  prepareSparklineForCell(sparkline, timeRange);

  const cellOptions = getSparklineCellOptions(getCellOptions(field));
  const config = getSparklineCellFieldConfig(field.config, cellOptions);

  const hideValue = field.config.custom?.cellOptions?.hideValue;
  let valueWidth = 0;
  let valueElement: React.ReactNode = null;
  if (!hideValue) {
    const value = isDataFrameWithValue(cell.value) ? cell.value.value : null;
    const displayValue = field.display!(value);
    const alignmentFactor = getAlignmentFactor(field, displayValue, cell.row.index);

    valueWidth = getSparklineCellValueWidth(alignmentFactor, theme);

    valueElement = (
      <FormattedValueDisplay
        style={{
          width: `${valueWidth - theme.spacing.gridSize}px`,
          textAlign: 'right',
          marginRight: theme.spacing(1),
        }}
        value={displayValue}
      />
    );
  }

  return (
    <div {...cellProps} className={tableStyles.cellContainer}>
      {valueElement}
      <div>
        <Sparkline
          width={innerWidth - valueWidth}
          height={tableStyles.cellHeightInner}
          sparkline={sparkline}
          config={config}
          theme={tableStyles.theme}
          showTooltip={cellOptions.showTooltip}
        />
      </div>
    </div>
  );
};

function getSparkline(value: unknown): FieldSparkline | undefined {
  if (Array.isArray(value)) {
    return {
      y: {
        name: 'test',
        type: FieldType.number,
        values: value,
        config: {},
      },
    };
  }

  if (isDataFrame(value)) {
    const timeField = value.fields.find((x) => x.type === FieldType.time);
    const numberField = value.fields.find((x) => x.type === FieldType.number);

    if (timeField && numberField) {
      return { x: timeField, y: numberField };
    }
  }

  return;
}

import { VizOrientation } from '@grafana/data';

import { BarGauge } from '../../../BarGauge/BarGauge';
import { getBarGaugeCellDisplayModes, getBarGaugeCellFieldConfig } from '../../barGaugeCellUtils';
import { MaybeWrapWithLink } from '../components/MaybeWrapWithLink';
import { TABLE } from '../constants';
import { type BarGaugeCellProps } from '../types';
import { getCellOptions, getAlignmentFactor } from '../utils';

export const BarGaugeCell = ({ value, field, theme, height, width, rowIdx }: BarGaugeCellProps) => {
  const displayValue = field.display!(value);
  const heightOffset = TABLE.CELL_PADDING * 2;
  const config = getBarGaugeCellFieldConfig(field);
  const { displayMode, valueDisplayMode } = getBarGaugeCellDisplayModes(getCellOptions(field));

  const alignmentFactors = getAlignmentFactor(field, displayValue, rowIdx!);
  // clamp the height of the gauge so it isn't stretched for large rows
  const renderedHeight = Math.min(height - heightOffset, TABLE.MAX_CELL_HEIGHT);

  return (
    <MaybeWrapWithLink field={field} rowIdx={rowIdx}>
      <BarGauge
        width={width}
        height={renderedHeight}
        field={config}
        display={field.display}
        text={{ valueSize: 14 }}
        value={displayValue}
        orientation={VizOrientation.Horizontal}
        theme={theme}
        alignmentFactors={alignmentFactors}
        itemSpacing={1}
        lcdCellWidth={8}
        displayMode={displayMode}
        valueDisplayMode={valueDisplayMode}
      />
    </MaybeWrapWithLink>
  );
};

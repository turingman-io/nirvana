import { useState } from 'react';

import { VizOrientation } from '@grafana/data';

import { BarGauge } from '../../BarGauge/BarGauge';
import { DataLinksActionsTooltip, renderSingleLink } from '../DataLinksActionsTooltip';
import { getBarGaugeCellDisplayModes, getBarGaugeCellFieldConfig } from '../barGaugeCellUtils';
import {
  type DataLinksActionsTooltipCoords,
  getAlignmentFactor,
  getCellOptions,
  getDataLinksActionsTooltipUtils,
} from '../cellUtils';
import { type TableCellProps } from '../types';

export const BarGaugeCell = (props: TableCellProps) => {
  const { field, innerWidth, tableStyles, cell, cellProps, row } = props;
  const displayValue = field.display!(cell.value);
  const config = getBarGaugeCellFieldConfig(field);
  const { displayMode, valueDisplayMode } = getBarGaugeCellDisplayModes(getCellOptions(field));

  const getLinks = () => {
    if (typeof field.getLinks !== 'function') {
      return [];
    }

    return field.getLinks({ valueRowIndex: row.index });
  };

  const alignmentFactors = getAlignmentFactor(field, displayValue, cell.row.index);

  const renderComponent = () => {
    return (
      <BarGauge
        width={innerWidth}
        height={tableStyles.cellHeightInner}
        field={config}
        display={field.display}
        text={{ valueSize: 14 }}
        value={displayValue}
        orientation={VizOrientation.Horizontal}
        theme={tableStyles.theme}
        alignmentFactors={alignmentFactors}
        itemSpacing={1}
        lcdCellWidth={8}
        displayMode={displayMode}
        valueDisplayMode={valueDisplayMode}
      />
    );
  };

  const [tooltipCoords, setTooltipCoords] = useState<DataLinksActionsTooltipCoords>();
  const { shouldShowLink, hasMultipleLinksOrActions } = getDataLinksActionsTooltipUtils(getLinks());
  const shouldShowTooltip = hasMultipleLinksOrActions && tooltipCoords !== undefined;

  const links = getLinks();

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      {...cellProps}
      className={tableStyles.cellContainer}
      style={{ ...cellProps.style, cursor: hasMultipleLinksOrActions ? 'context-menu' : 'auto' }}
      onClick={({ clientX, clientY }) => {
        setTooltipCoords({ clientX, clientY });
      }}
    >
      {shouldShowLink ? (
        renderSingleLink(links[0], renderComponent())
      ) : shouldShowTooltip ? (
        <DataLinksActionsTooltip
          links={links}
          value={renderComponent()}
          coords={tooltipCoords}
          onTooltipClose={() => setTooltipCoords(undefined)}
        />
      ) : (
        renderComponent()
      )}
    </div>
  );
};

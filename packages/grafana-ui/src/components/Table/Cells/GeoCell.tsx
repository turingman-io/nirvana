import type { JSX } from 'react';

import { formatGeoCellValue, useOpenLayersContext } from '../geo';
import { type TableCellProps } from '../types';

export function GeoCell(props: TableCellProps): JSX.Element {
  const { cell, tableStyles, cellProps } = props;
  const { formatGeometry } = useOpenLayersContext();
  const disp = formatGeoCellValue(cell.value, formatGeometry);

  return (
    <div {...cellProps} className={tableStyles.cellContainer}>
      <div className={tableStyles.cellText} style={{ fontFamily: 'monospace' }}>
        {disp}
      </div>
    </div>
  );
}

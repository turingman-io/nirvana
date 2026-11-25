import { css } from '@emotion/css';

import { useOpenLayersContext, formatGeoCellValue } from '../../geo';
import type { GeoCellProps, TableCellStyles } from '../types';

export function GeoCell({ value }: GeoCellProps) {
  const { formatGeometry } = useOpenLayersContext();
  return formatGeoCellValue(value, formatGeometry);
}

const styles = css({
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const getStyles: TableCellStyles = () => styles;

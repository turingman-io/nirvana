import { useMeasure } from 'react-use';

import { useTheme2 } from '../../themes/ThemeContext';

import { type VizLayoutLegendLayout, type VizLayoutLegendLayoutProps } from './types';
import { getLegendFlexDirection, getLegendStyle, getVizLayoutLegendPlacement, getVizSize } from './utils';

/**
 * Measures the legend rendered by VizLayout and works out its layout next to the visualization.
 * `layout` is `null` when there is no legend.
 */
export function useVizLayoutLegend(legend: VizLayoutLegendLayoutProps | undefined, width: number, height: number) {
  const theme = useTheme2();
  const [legendRef, legendSize] = useMeasure<HTMLDivElement>();

  let layout: VizLayoutLegendLayout | null = null;

  if (legend) {
    const placement = getVizLayoutLegendPlacement(legend.placement, theme);

    layout = {
      placement,
      flexDirection: getLegendFlexDirection(placement),
      legendStyle: getLegendStyle(placement, legend),
      vizSize: getVizSize({ width, height }, placement, legend, legendSize),
    };
  }

  return { legendRef, layout };
}

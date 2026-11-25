import type uPlot from 'uplot';

// if hovered value is null, how far we may scan left/right to hover nearest non-null
const DEFAULT_HOVER_NULL_PROXIMITY = 15;
const DEFAULT_FOCUS_PROXIMITY = 30;

/**
 * Cursor hover and series focus behavior. A configured `hoverProximity` applies to both.
 */
export function getCursorConfig(hoverProximity?: number): Partial<uPlot.Cursor> {
  return {
    // horizontal proximity / point hover behavior
    hover: {
      prox: (self, seriesIdx, hoveredIdx) => {
        if (hoverProximity != null) {
          return hoverProximity;
        }

        // when hovering null values, scan data left/right up to 15px
        const yVal = self.data[seriesIdx][hoveredIdx];
        if (yVal === null) {
          return DEFAULT_HOVER_NULL_PROXIMITY;
        }

        // no proximity limit
        return null;
      },
      skip: [null],
    },
    // vertical proximity / series focus behavior
    focus: {
      prox: hoverProximity ?? DEFAULT_FOCUS_PROXIMITY,
    },
    points: { one: true },
  };
}

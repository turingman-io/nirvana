import type uPlot from 'uplot';

import { type TimeRange } from '@grafana/data';
import { type UPlotConfigBuilder } from '@grafana/ui/internal';

/**
 * Range of the time (x) scale. It follows the time range, except while panning, when it keeps the panned
 * min/max until the time range has caught up with them.
 */
export function getTimeScaleRange(
  builder: UPlotConfigBuilder,
  getTimeRange: () => TimeRange
): () => uPlot.Range.MinMax {
  return () => {
    const state = builder.getState();
    if (state.isPanning) {
      if (state.isTimeRangePending) {
        const timeRange = getTimeRange();
        const propsFrom = timeRange.from.valueOf();
        const propsTo = timeRange.to.valueOf();

        const MIN_TIMESPAN_MS = 1;
        const fromMatches = Math.abs(propsFrom - state.min) <= MIN_TIMESPAN_MS;
        const toMatches = Math.abs(propsTo - state.max) <= MIN_TIMESPAN_MS;
        const timeRangeHasUpdated = fromMatches && toMatches;

        if (timeRangeHasUpdated) {
          builder.setState({ isPanning: false });
          return [propsFrom, propsTo];
        }
      }

      return [state.min, state.max];
    }
    const timeRange = getTimeRange();
    return [timeRange.from.valueOf(), timeRange.to.valueOf()];
  };
}

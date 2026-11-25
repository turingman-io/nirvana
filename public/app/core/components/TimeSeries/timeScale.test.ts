import { dateTime, type TimeRange } from '@grafana/data';
import { UPlotConfigBuilder } from '@grafana/ui/internal';

import { getTimeScaleRange } from './timeScale';

function makeTimeRange(from: number, to: number): TimeRange {
  return { from: dateTime(from), to: dateTime(to), raw: { from: dateTime(from), to: dateTime(to) } };
}

describe('getTimeScaleRange', () => {
  it('follows the time range when not panning', () => {
    const range = getTimeScaleRange(new UPlotConfigBuilder(), () => makeTimeRange(1000, 5000));

    expect(range()).toEqual([1000, 5000]);
  });

  it('keeps the panned range until the time range catches up with it', () => {
    const builder = new UPlotConfigBuilder();
    let timeRange = makeTimeRange(1000, 5000);
    const range = getTimeScaleRange(builder, () => timeRange);

    builder.setState({ isPanning: true, min: 2000, max: 4000, isTimeRangePending: true });
    expect(range()).toEqual([2000, 4000]);
    expect(builder.getState().isPanning).toBe(true);

    timeRange = makeTimeRange(2000, 4000);
    expect(range()).toEqual([2000, 4000]);
    expect(builder.getState().isPanning).toBe(false);
  });
});

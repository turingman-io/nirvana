import type uPlot from 'uplot';

import { isolatedPointsFilter } from './pointsFilter';

describe('isolatedPointsFilter', () => {
  // one data point per pixel, so gap edges map straight to data indices
  function makePlot(yData: Array<number | null>) {
    return {
      data: [yData.map((_, i) => i), yData],
      posToIdx: (pos: number) => Math.round(pos),
    } as unknown as uPlot;
  }

  it('leaves the points alone when uPlot shows them', () => {
    expect(isolatedPointsFilter(makePlot([1, null, 3]), 1, true, [[0, 2]])).toBeNull();
  });

  it('shows the points that are isolated between gaps', () => {
    const gaps = [
      [0, 2],
      [2, 4],
    ];

    expect(isolatedPointsFilter(makePlot([1, null, 3, null, 5]), 1, false, gaps)).toEqual([0, 2, 4]);
  });

  it('shows no points when each one has a non-null neighbor', () => {
    expect(isolatedPointsFilter(makePlot([1, 2, null, 4, 5]), 1, false, [[1, 3]])).toBeNull();
  });

  it('shows the only non-null point of a series', () => {
    expect(isolatedPointsFilter(makePlot([null, 7, null]), 1, false, null)).toEqual([1]);
  });
});

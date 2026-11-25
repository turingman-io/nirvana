import type uPlot from 'uplot';

/**
 * When uPlot skips drawing a series' points because they are too dense, this still draws the points that are
 * isolated between null gaps, since no line is drawn to them.
 */
export function isolatedPointsFilter(u: uPlot, seriesIdx: number, show: boolean, gaps?: number[][] | null) {
  let filtered = [];

  if (!show) {
    const yData = u.data[seriesIdx];

    if (gaps && gaps.length) {
      const firstIdx = u.posToIdx(gaps[0][0], true);

      if (yData[firstIdx - 1] == null) {
        filtered.push(firstIdx);
      }

      // show single points between consecutive gaps that share end/start
      for (let i = 0; i < gaps.length; i++) {
        let thisGap = gaps[i];
        let nextGap = gaps[i + 1];

        if (nextGap && thisGap[1] === nextGap[0]) {
          // approx when data density is > 1pt/px, since gap start/end pixels are rounded
          let approxIdx = u.posToIdx(thisGap[1], true);

          if (yData[approxIdx] == null) {
            // scan left/right alternating to find closest index with non-null value
            for (let j = 1; j < 100; j++) {
              if (yData[approxIdx + j] != null) {
                approxIdx += j;
                break;
              }
              if (yData[approxIdx - j] != null) {
                approxIdx -= j;
                break;
              }
            }
          }

          filtered.push(approxIdx);
        }
      }

      const lastIdx = u.posToIdx(gaps[gaps.length - 1][1], true);

      if (yData[lastIdx + 1] == null) {
        filtered.push(lastIdx);
      }
    }
    // single point
    else {
      // scan right
      let leftIdx = 0;
      while (yData[leftIdx] === null) {
        leftIdx++;
      }

      // scan left
      let rightIdx = yData.length - 1;
      while (rightIdx >= leftIdx && yData[rightIdx] === null) {
        rightIdx--;
      }

      // render if same
      if (leftIdx === rightIdx) {
        filtered.push(leftIdx);
      }
    }
  }

  return filtered.length ? filtered : null;
}

import type uPlot from 'uplot';

import { getCursorConfig } from './cursor';

type HoverProx = (u: uPlot, seriesIdx: number, hoveredIdx: number) => number | null;

describe('getCursorConfig', () => {
  // the hover proximity callback only reads the plot data
  const u = {
    data: [
      [1000, 2000, 3000],
      [10, null, 30],
    ],
  } as unknown as uPlot;

  it('limits hover proximity only when hovering a null value', () => {
    const prox = getCursorConfig().hover?.prox as HoverProx;

    expect(prox(u, 1, 0)).toBeNull();
    expect(prox(u, 1, 1)).toBe(15);
  });

  it('uses the configured hover proximity for both hover and focus', () => {
    const cursor = getCursorConfig(42);
    const prox = cursor.hover?.prox as HoverProx;

    expect(prox(u, 1, 1)).toBe(42);
    expect(cursor.focus?.prox).toBe(42);
  });

  it('defaults focus proximity to 30px', () => {
    expect(getCursorConfig().focus?.prox).toBe(30);
  });
});

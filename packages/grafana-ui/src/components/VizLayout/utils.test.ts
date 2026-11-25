import { createTheme } from '@grafana/data';

import { getLegendFlexDirection, getLegendStyle, getVizLayoutLegendPlacement, getVizSize } from './utils';

const theme = createTheme();
const unmeasured = { width: 0, height: 0 };

function setViewportWidth(value: number) {
  Object.defineProperty(document.body, 'clientWidth', { value, configurable: true });
}

describe('getVizLayoutLegendPlacement', () => {
  afterEach(() => {
    setViewportWidth(0);
  });

  it('keeps the requested placement on wide viewports', () => {
    setViewportWidth(theme.breakpoints.values.lg);

    expect(getVizLayoutLegendPlacement('right', theme)).toBe('right');
    expect(getVizLayoutLegendPlacement('bottom', theme)).toBe('bottom');
  });

  it('puts the legend at the bottom on narrow viewports', () => {
    setViewportWidth(theme.breakpoints.values.lg - 1);

    expect(getVizLayoutLegendPlacement('right', theme)).toBe('bottom');
  });
});

describe('getLegendFlexDirection', () => {
  it.each([
    { placement: 'bottom' as const, expected: 'column' },
    { placement: 'right' as const, expected: 'row' },
  ])('stacks the viz and a $placement legend as a $expected', ({ placement, expected }) => {
    expect(getLegendFlexDirection(placement)).toBe(expected);
  });
});

describe('getLegendStyle', () => {
  it('caps a bottom legend at 35% by default', () => {
    expect(getLegendStyle('bottom', { placement: 'bottom' })).toEqual({ maxHeight: '35%' });
  });

  it('applies the max height of a bottom legend', () => {
    expect(getLegendStyle('bottom', { placement: 'bottom', maxHeight: '20%' })).toEqual({ maxHeight: '20%' });
  });

  it('caps a right legend at 60% by default', () => {
    expect(getLegendStyle('right', { placement: 'right' })).toEqual({ maxWidth: '60%' });
  });

  it('applies a pixel width together with the max width', () => {
    expect(getLegendStyle('right', { placement: 'right', width: 200, maxWidth: '50%' })).toEqual({
      width: 200,
      maxWidth: '50%',
    });
  });

  it('applies a css width without the max width', () => {
    expect(getLegendStyle('right', { placement: 'right', width: '35%', maxWidth: '50%' })).toEqual({ width: '35%' });
  });

  it('styles a right legend moved to the bottom as a bottom legend', () => {
    expect(getLegendStyle('bottom', { placement: 'right', width: 200 })).toEqual({ maxHeight: '35%' });
  });
});

describe('getVizSize', () => {
  const size = { width: 800, height: 600 };

  describe('with a bottom legend', () => {
    const legend = { placement: 'bottom' as const };

    it('returns null until the legend is measured', () => {
      expect(getVizSize(size, 'bottom', legend, unmeasured)).toBeNull();
    });

    it('takes the legend height off the viz height', () => {
      expect(getVizSize(size, 'bottom', legend, { width: 800, height: 100 })).toEqual({ width: 800, height: 500 });
    });

    it('keeps the full height while the legend still measures the full height', () => {
      expect(getVizSize(size, 'bottom', legend, { width: 200, height: 600 })).toEqual(size);
    });
  });

  describe('with a right legend', () => {
    it('returns null until the legend is measured', () => {
      expect(getVizSize(size, 'right', { placement: 'right' }, unmeasured)).toBeNull();
    });

    it('takes the legend width off the viz width', () => {
      expect(getVizSize(size, 'right', { placement: 'right' }, { width: 150, height: 600 })).toEqual({
        width: 650,
        height: 600,
      });
    });

    it('reserves a pixel width before the legend is measured', () => {
      expect(getVizSize(size, 'right', { placement: 'right', width: 200 }, unmeasured)).toEqual({
        width: 600,
        height: 600,
      });
    });

    it('waits for the legend to be measured when its width is a css value', () => {
      expect(getVizSize(size, 'right', { placement: 'right', width: '35%' }, unmeasured)).toBeNull();
    });

    it('keeps the full width while the legend still measures the full width', () => {
      expect(getVizSize(size, 'right', { placement: 'right' }, { width: 800, height: 100 })).toEqual(size);
    });
  });
});

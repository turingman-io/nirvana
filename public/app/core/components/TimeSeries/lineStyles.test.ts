import { type LineStyle } from '@grafana/schema';

import { resolveLineStyle } from './lineStyles';

describe('resolveLineStyle', () => {
  it('passes non accessible line styles through unchanged', () => {
    const dashed: LineStyle = { fill: 'dash', dash: [10, 10] };

    expect(resolveLineStyle(undefined, 0)).toBeUndefined();
    expect(resolveLineStyle(dashed, 3)).toBe(dashed);
  });

  it('gives each series its own pattern for the accessible line style, cycling after 9 series', () => {
    const styles = Array.from({ length: 10 }, (_, i) => resolveLineStyle({ fill: 'accessible' }, i));

    expect(styles[0]).toEqual({ fill: 'solid' });
    expect(styles[1]).toEqual({ fill: 'dash', dash: [10, 10] });
    expect(new Set(styles.slice(0, 9).map((style) => JSON.stringify(style))).size).toBe(9);
    expect(styles[9]).toEqual(styles[0]);
  });
});

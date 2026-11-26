import { createTheme, FieldColorModeId, type FieldColorMode, getFieldColorMode } from '@grafana/data';

import { getColorSchemeBackground } from './colorSchemePreview';

const theme = createTheme();

function paletteMode(colors: string[]): FieldColorMode {
  return {
    id: 'test-palette',
    name: 'Test palette',
    isContinuous: false,
    getCalculator: () => () => colors[0],
    getColors: () => colors,
  };
}

describe('getColorSchemeBackground', () => {
  it('returns a smooth gradient for continuous schemes', () => {
    const mode = getFieldColorMode(FieldColorModeId.ContinuousGrYlRd);
    const [green, yellow, red] = ['green', 'yellow', 'red'].map(theme.visualization.getColorByName);

    expect(getColorSchemeBackground(theme, mode)).toBe(`linear-gradient(90deg, ${green}, ${yellow}, ${red})`);
  });

  it('follows the reversed colors of a reversed scheme', () => {
    const mode = getFieldColorMode(FieldColorModeId.ContinuousGrYlRd, true);
    const [red, yellow, green] = ['red', 'yellow', 'green'].map(theme.visualization.getColorByName);

    expect(getColorSchemeBackground(theme, mode)).toBe(`linear-gradient(90deg, ${red}, ${yellow}, ${green})`);
  });

  it('shows each palette color as a separate block', () => {
    const mode = paletteMode(['#ff0000', '#00ff00', '#0000ff', '#ffff00']);

    expect(getColorSchemeBackground(theme, mode)).toBe(
      'linear-gradient(90deg, ' +
        '#ff0000 0% calc(25% - 1px), transparent calc(25% - 1px) 25%, ' +
        '#00ff00 25% calc(50% - 1px), transparent calc(50% - 1px) 50%, ' +
        '#0000ff 50% calc(75% - 1px), transparent calc(75% - 1px) 75%, ' +
        '#ffff00 75% 100%)'
    );
  });

  it('resolves named palette colors', () => {
    const mode = paletteMode(['green', 'blue']);
    const [green, blue] = ['green', 'blue'].map(theme.visualization.getColorByName);

    expect(getColorSchemeBackground(theme, mode)).toBe(
      `linear-gradient(90deg, ${green} 0% calc(50% - 1px), transparent calc(50% - 1px) 50%, ${blue} 50% 100%)`
    );
  });

  it.each([FieldColorModeId.Fixed, FieldColorModeId.Shades, FieldColorModeId.Thresholds])(
    'returns undefined for %s, which has no fixed set of colors',
    (id) => {
      expect(getColorSchemeBackground(theme, getFieldColorMode(id))).toBeUndefined();
    }
  );
});

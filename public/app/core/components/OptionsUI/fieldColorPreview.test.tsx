import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { type FieldColor, type FieldColorMode, FieldColorModeId } from '@grafana/data';

import { getColorSchemeBackground } from './colorSchemePreview';
import { FieldColorEditor } from './fieldColor';

// jsdom drops gradient backgrounds, so stand in a plain color for the scheme's background
jest.mock('./colorSchemePreview', () => ({
  getColorSchemeBackground: jest.fn((_theme, mode: FieldColorMode) => (mode.getColors ? 'blue' : undefined)),
}));

const item = { settings: { byValueSupport: true } } as Parameters<typeof FieldColorEditor>[0]['item'];

function renderEditor(value: FieldColor) {
  render(<FieldColorEditor value={value} onChange={jest.fn()} item={item} id="color" context={{ data: [] }} />);
}

describe('FieldColorEditor color scheme preview', () => {
  it('shows the colors of the selected scheme under the picker', () => {
    renderEditor({ mode: FieldColorModeId.ContinuousBlues });

    expect(getColorSchemeBackground).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: FieldColorModeId.ContinuousBlues })
    );
    expect(screen.getByRole('img', { name: 'Color scheme preview' })).toHaveStyle({ background: 'blue' });
  });

  it('does not show a preview for a single color', () => {
    renderEditor({ mode: FieldColorModeId.Fixed, fixedColor: 'red' });

    expect(screen.getByText('Single color')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Color scheme preview' })).not.toBeInTheDocument();
  });
});

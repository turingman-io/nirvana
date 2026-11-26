import { render, screen } from 'test/test-utils';

import { PluginDetailsId } from './PluginDetailsId';

describe('PluginDetailsId', () => {
  const originalIsSecureContext = window.isSecureContext;

  beforeAll(() => {
    Object.assign(window, { isSecureContext: true });
  });

  afterAll(() => {
    Object.assign(window, { isSecureContext: originalIsSecureContext });
  });

  it('shows the plugin ID', () => {
    render(<PluginDetailsId pluginId="grafana-testdata-datasource" />);

    expect(screen.getByTestId('plugin-details-id')).toHaveTextContent('grafana-testdata-datasource');
  });

  it('copies the plugin ID to the clipboard', async () => {
    const { user } = render(<PluginDetailsId pluginId="grafana-testdata-datasource" />);

    await user.click(screen.getByRole('button', { name: 'Copy plugin ID' }));

    expect(await screen.findByText('Copied')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe('grafana-testdata-datasource');
  });
});

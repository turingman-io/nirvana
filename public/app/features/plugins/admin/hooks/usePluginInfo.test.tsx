import { renderHook } from '@testing-library/react';
import { render, screen } from 'test/test-utils';

import { PluginSignatureStatus, PluginType } from '@grafana/data';

import { type CatalogPlugin } from '../types';

import { usePluginInfo } from './usePluginInfo';

const plugin: CatalogPlugin = {
  description: 'Generates test data',
  downloads: 0,
  hasUpdate: false,
  id: 'grafana-testdata-datasource',
  info: {
    logos: { small: 'small-logo-url', large: 'large-logo-url' },
    keywords: [],
  },
  isDev: false,
  isCore: true,
  isEnterprise: false,
  isInstalled: true,
  isDisabled: false,
  isDeprecated: false,
  isPreinstalled: { found: false, withVersion: false },
  isPublished: true,
  name: 'TestData',
  orgName: 'Grafana Labs',
  signature: PluginSignatureStatus.internal,
  popularity: 0,
  publishedAt: '',
  type: PluginType.datasource,
  updatedAt: '',
  installedVersion: '12.4.0',
  managed: { enabled: false, strategy: undefined },
};

describe('usePluginInfo', () => {
  it('lists the plugin ID after the publisher', () => {
    const { result } = renderHook(() => usePluginInfo(plugin));
    const labels = result.current.map((item) => item.label);

    expect(labels.indexOf('Plugin ID')).toBe(labels.indexOf('From') + 1);
  });

  it('renders the plugin ID as its value', () => {
    const { result } = renderHook(() => usePluginInfo(plugin));
    const pluginIdItem = result.current.find((item) => item.label === 'Plugin ID');

    render(<>{pluginIdItem?.value}</>);

    expect(screen.getByTestId('plugin-details-id')).toHaveTextContent('grafana-testdata-datasource');
  });
});

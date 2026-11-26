import userEvent from '@testing-library/user-event';
import { render, screen } from 'test/test-utils';

import { getPanelPlugin } from '@grafana/data/test';
import { selectors } from '@grafana/e2e-selectors';
import { setPluginImportUtils } from '@grafana/runtime';
import { sceneGraph, SceneTimeRange, VizPanel, type VizPanelState } from '@grafana/scenes';

import { DashboardScene } from '../scene/DashboardScene';
import { DefaultGridLayoutManager } from '../scene/layout-default/DefaultGridLayoutManager';
import { DashboardInteractions } from '../utils/interactions';

import {
  PANEL_TIME_RANGE_SUBTITLE,
  PanelDescriptionTextArea,
  PanelTimeRangeSubtitleSwitch,
} from './getPanelFrameOptions';

setPluginImportUtils({
  importPanelPlugin: () => Promise.resolve(getPanelPlugin({ id: 'timeseries' }, () => <div>Panel content</div>)),
  getPanelPluginFromCache: () => undefined,
});

function setup(panelState: Partial<VizPanelState> = {}) {
  const panel = new VizPanel({ key: 'panel-1', title: 'CPU usage', pluginId: 'timeseries', ...panelState });
  const dashboard = new DashboardScene({
    $timeRange: new SceneTimeRange({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-01-02T12:00:00.000Z',
      timeZone: 'utc',
    }),
    isEditing: true,
    body: DefaultGridLayoutManager.fromVizPanels([panel]),
  });
  // Edit actions are performed by the dashboard sidebar
  const deactivateSidebar = dashboard.state.sidebar.activate();

  return { panel, deactivateSidebar };
}

describe('PanelTimeRangeSubtitleSwitch', () => {
  let panelSettingChanged: jest.SpyInstance;

  beforeEach(() => {
    panelSettingChanged = jest.spyOn(DashboardInteractions, 'panelSettingChanged').mockImplementation();
  });

  afterEach(() => {
    panelSettingChanged.mockRestore();
  });

  it('shows the time range of the panel as its subtitle', async () => {
    const { panel, deactivateSidebar } = setup();
    render(<PanelTimeRangeSubtitleSwitch panel={panel} />);

    await userEvent.click(screen.getByRole('switch'));

    expect(panel.state.subtitle).toBe(PANEL_TIME_RANGE_SUBTITLE);
    expect(sceneGraph.interpolate(panel, panel.state.subtitle, undefined, 'text')).toBe(
      '2024-01-01 00:00:00 to 2024-01-02 12:00:00'
    );
    expect(panelSettingChanged).toHaveBeenCalledWith(expect.objectContaining({ item: 'toggle_panel_time_range' }));

    deactivateSidebar();
  });

  it('renders the time range below the panel title', async () => {
    const { panel, deactivateSidebar } = setup({ subtitle: PANEL_TIME_RANGE_SUBTITLE });
    render(<panel.Component model={panel} />);

    expect(await screen.findByTestId(selectors.components.Panels.Panel.subtitle)).toHaveTextContent(
      '2024-01-01 00:00:00 to 2024-01-02 12:00:00'
    );

    deactivateSidebar();
  });

  it('removes the time range when turned off', async () => {
    const { panel, deactivateSidebar } = setup({ subtitle: PANEL_TIME_RANGE_SUBTITLE });
    render(<PanelTimeRangeSubtitleSwitch panel={panel} />);

    expect(screen.getByRole('switch')).toBeChecked();
    await userEvent.click(screen.getByRole('switch'));

    expect(panel.state.subtitle).toBeUndefined();

    deactivateSidebar();
  });

  it('is not available while the description is used as the subtitle', () => {
    const { panel, deactivateSidebar } = setup({ subtitle: 'Requests per second' });
    render(<PanelTimeRangeSubtitleSwitch panel={panel} />);

    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByRole('switch')).not.toBeChecked();

    deactivateSidebar();
  });
});

describe('PanelDescriptionTextArea with the time range subtitle', () => {
  it('keeps the description in the field and does not offer it as subtitle', () => {
    const { panel, deactivateSidebar } = setup({
      description: 'Requests per second',
      subtitle: PANEL_TIME_RANGE_SUBTITLE,
    });
    render(<PanelDescriptionTextArea panel={panel} />);

    expect(screen.getByRole('textbox')).toHaveValue('Requests per second');
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByRole('switch')).toBeDisabled();

    deactivateSidebar();
  });

  it('does not show the time range in an empty description field', () => {
    const { panel, deactivateSidebar } = setup({ subtitle: PANEL_TIME_RANGE_SUBTITLE });
    render(<PanelDescriptionTextArea panel={panel} />);

    expect(screen.getByRole('textbox')).toHaveValue('');

    deactivateSidebar();
  });
});

import { getPanelPlugin } from '@grafana/data/test';
import { setPluginImportUtils } from '@grafana/runtime';
import { sceneGraph, SceneTimeRange, VizPanel } from '@grafana/scenes';

import { activateFullSceneTree } from '../utils/test-utils';

import { registerDashboardMacro } from './DashboardMacro';
import { DashboardScene } from './DashboardScene';
import { AutoGridItem } from './layout-auto-grid/AutoGridItem';
import { AutoGridLayoutManager } from './layout-auto-grid/AutoGridLayoutManager';
import { RowItem } from './layout-rows/RowItem';
import { RowsLayoutManager } from './layout-rows/RowsLayoutManager';
import { PanelTimeRange } from './panel-timerange/PanelTimeRange';

setPluginImportUtils({
  importPanelPlugin: () => Promise.resolve(getPanelPlugin({})),
  getPanelPluginFromCache: () => undefined,
});

function buildDashboard(timeRange: SceneTimeRange, panel = new VizPanel({ key: 'panel-1', title: 'Panel' })) {
  const grid = AutoGridLayoutManager.createEmpty();
  grid.state.layout.setState({ children: [new AutoGridItem({ body: panel })] });

  const row = new RowItem({ title: 'Errors (${__time_range})', layout: grid });
  const dashboard = new DashboardScene({
    $timeRange: timeRange,
    body: new RowsLayoutManager({ rows: [row] }),
  });

  return { dashboard, row, panel };
}

describe('${__time_range}', () => {
  let unregister: () => void;

  beforeEach(() => {
    unregister = registerDashboardMacro();
  });

  afterEach(() => unregister());

  it('describes a relative time range like the time picker', () => {
    const { dashboard } = buildDashboard(new SceneTimeRange({ from: 'now-6h', to: 'now' }));

    expect(sceneGraph.interpolate(dashboard, '${__time_range}')).toBe('Last 6 hours');
  });

  it('uses the quick range name when there is one', () => {
    const { dashboard } = buildDashboard(new SceneTimeRange({ from: 'now-1d/d', to: 'now-1d/d' }));

    expect(sceneGraph.interpolate(dashboard, '${__time_range}')).toBe('Yesterday');
  });

  it('formats an absolute time range in the dashboard time zone', () => {
    const { dashboard } = buildDashboard(
      new SceneTimeRange({ from: '2024-01-01T00:00:00.000Z', to: '2024-01-02T12:00:00.000Z', timeZone: 'utc' })
    );

    expect(sceneGraph.interpolate(dashboard, '${__time_range}')).toBe('2024-01-01 00:00:00 to 2024-01-02 12:00:00');
  });

  it('can be used in section titles', () => {
    const { row } = buildDashboard(new SceneTimeRange({ from: 'now-24h', to: 'now' }));

    expect(sceneGraph.interpolate(row, row.state.title, undefined, 'text')).toBe('Errors (Last 24 hours)');
  });

  it('uses the time range of a panel with a relative time override', () => {
    const panel = new VizPanel({ key: 'panel-1', title: 'Panel', $timeRange: new PanelTimeRange({ timeFrom: '1h' }) });
    const { dashboard } = buildDashboard(new SceneTimeRange({ from: 'now-6h', to: 'now' }), panel);
    activateFullSceneTree(dashboard);

    expect(sceneGraph.interpolate(panel, '${__time_range}')).toBe('Last 1 hour');
    expect(sceneGraph.interpolate(dashboard, '${__time_range}')).toBe('Last 6 hours');
  });
});

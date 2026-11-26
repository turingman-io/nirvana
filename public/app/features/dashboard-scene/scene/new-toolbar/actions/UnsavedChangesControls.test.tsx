import { act } from 'react';
import { render, screen } from 'test/test-utils';

import { SceneTimeRange } from '@grafana/scenes';
import { setTestFlags } from '@grafana/test-utils/unstable';

import { DashboardScene } from '../../DashboardScene';

import { UnsavedChangesControls } from './UnsavedChangesControls';

interface BuildSceneOpts {
  uid?: string;
  isEditing?: boolean;
  isDirty?: boolean;
}

function buildTestScene({ uid = 'dash-1', isEditing = true, isDirty = true }: BuildSceneOpts = {}) {
  const scene = new DashboardScene({
    title: 'Test',
    uid,
    isEditing,
    isDirty,
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now' }),
  });

  scene.openChanges = jest.fn();
  scene.discardChangesAndKeepEditing = jest.fn();

  return scene;
}

describe('UnsavedChangesControls', () => {
  afterEach(() => {
    act(() => {
      setTestFlags({});
    });
  });

  it('shows the unsaved changes badge and actions while editing a dashboard with changes', () => {
    render(<UnsavedChangesControls dashboard={buildTestScene()} />);

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare with the last saved version' })).toHaveTextContent(
      'View changes'
    );
    expect(screen.getByRole('button', { name: 'Go back to the last saved version' })).toHaveTextContent(
      'Discard changes'
    );
  });

  it('renders nothing when the dashboard has no unsaved changes', () => {
    const { container } = render(<UnsavedChangesControls dashboard={buildTestScene({ isDirty: false })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing outside edit mode', () => {
    const { container } = render(<UnsavedChangesControls dashboard={buildTestScene({ isEditing: false })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a dashboard that has never been saved', () => {
    const { container } = render(<UnsavedChangesControls dashboard={buildTestScene({ uid: '' })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when dashboard modes provide their own save menu actions', () => {
    act(() => {
      setTestFlags({ dashboardNewLayouts: true, 'grafana.dashboardPreviewMode': true });
    });

    const { container } = render(<UnsavedChangesControls dashboard={buildTestScene()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the changes view', async () => {
    const scene = buildTestScene();
    const { user } = render(<UnsavedChangesControls dashboard={scene} />);

    await user.click(screen.getByRole('button', { name: 'Compare with the last saved version' }));

    expect(scene.openChanges).toHaveBeenCalledTimes(1);
  });

  it('discards the changes only after the user confirms', async () => {
    const scene = buildTestScene();
    const { user } = render(<UnsavedChangesControls dashboard={scene} />);

    await user.click(screen.getByRole('button', { name: 'Go back to the last saved version' }));

    expect(screen.getByRole('dialog', { name: 'Discard unsaved changes?' })).toBeInTheDocument();
    expect(scene.discardChangesAndKeepEditing).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(scene.discardChangesAndKeepEditing).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Discard unsaved changes?' })).not.toBeInTheDocument();
  });
});

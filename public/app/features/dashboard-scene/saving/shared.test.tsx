import { render, screen } from 'test/test-utils';

import {
  AnnoKeyManagerIdentity,
  AnnoKeyManagerKind,
  AnnoKeySourcePath,
  AnnoKeyUseCrossDashboardVariables,
  ManagerKind,
} from 'app/features/apiserver/types';
import { type DashboardMeta } from 'app/types/dashboard';

import { type SaveDashboardDrawer } from './SaveDashboardDrawer';
import { SaveConflictAlert, SaveFormActions, nextMetaAfterFolderPick } from './shared';

describe('nextMetaAfterFolderPick', () => {
  it('keeps the k8s identity and unrelated annotations, drops the folder-bound ones, and sets the folder', () => {
    const meta: DashboardMeta = {
      folderUid: 'old-folder',
      folderTitle: 'Old folder',
      k8s: {
        name: 'dash-uid',
        resourceVersion: '42',
        annotations: {
          [AnnoKeyManagerIdentity]: 'old-repo',
          [AnnoKeyManagerKind]: ManagerKind.Repo,
          [AnnoKeySourcePath]: 'old-folder/dash.json',
          [AnnoKeyUseCrossDashboardVariables]: '{"global":"all","folder":"none"}',
        },
      },
    };

    expect(nextMetaAfterFolderPick(meta, 'new-folder', 'New folder')).toEqual({
      folderUid: 'new-folder',
      folderTitle: 'New folder',
      k8s: {
        name: 'dash-uid',
        resourceVersion: '42',
        annotations: { [AnnoKeyUseCrossDashboardVariables]: '{"global":"all","folder":"none"}' },
      },
    });
  });

  it('only sets the folder when there is no k8s meta', () => {
    expect(nextMetaAfterFolderPick({ folderUid: 'old-folder' }, '', 'Dashboards')).toEqual({
      folderUid: '',
      folderTitle: 'Dashboards',
      k8s: undefined,
    });
  });
});

describe('SaveFormActions', () => {
  const drawer = { onClose: jest.fn() } as unknown as SaveDashboardDrawer;
  const saveButton = <button type="button">Save</button>;

  it('offers Save, then the further actions, then Cancel, which closes the drawer', async () => {
    const { user } = render(
      <SaveFormActions drawer={drawer} saveButton={saveButton}>
        <button type="button">Ask Assistant to update</button>
      </SaveFormActions>
    );

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Save',
      'Ask Assistant to update',
      'Cancel',
    ]);
    expect(screen.queryByText('No changes to save')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(drawer.onClose).toHaveBeenCalledTimes(1);
  });

  it('notes when there is nothing to save', () => {
    render(<SaveFormActions drawer={drawer} saveButton={saveButton} showNoChanges />);

    expect(screen.getByText('No changes to save')).toBeInTheDocument();
  });
});

describe('SaveConflictAlert', () => {
  it("shows the server's message along with the actions it offers", () => {
    render(
      <SaveConflictAlert message="The dashboard has been changed by someone else">
        <button type="button">Save and overwrite</button>
      </SaveConflictAlert>
    );

    expect(screen.getByText('Someone else has updated this dashboard')).toBeInTheDocument();
    expect(screen.getByText('The dashboard has been changed by someone else')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save and overwrite' })).toBeInTheDocument();
  });
});

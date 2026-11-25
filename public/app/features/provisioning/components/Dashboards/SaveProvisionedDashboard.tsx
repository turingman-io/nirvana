import { type SaveDashboardDrawer } from 'app/features/dashboard-scene/saving/SaveDashboardDrawer';
import { type DashboardChangeInfo } from 'app/features/dashboard-scene/saving/shared';
import { useSaveFormDraft } from 'app/features/dashboard-scene/saving/useParkSaveFormDraft';
import { type DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { type DashboardRepositoryView } from '../../hooks/useDashboardRepositoryView';
import { RepoViewStatus } from '../../hooks/useGetResourceRepositoryView';
import { useProvisionedDashboardData } from '../../hooks/useProvisionedDashboardData';
import { type RecoverToNewBranch } from '../../types';
import { ProvisionedFormGate } from '../ProvisionedFormGate';

import { SaveProvisionedDashboardForm } from './SaveProvisionedDashboardForm';

export interface SaveProvisionedDashboardProps {
  dashboard: DashboardScene;
  drawer: SaveDashboardDrawer;
  changeInfo: DashboardChangeInfo;
  saveAsCopy?: boolean;
  recoverToNewBranch?: RecoverToNewBranch;
}

interface Props extends SaveProvisionedDashboardProps {
  view: DashboardRepositoryView;
}

export function SaveProvisionedDashboard({
  drawer,
  changeInfo,
  dashboard,
  saveAsCopy,
  recoverToNewBranch,
  view,
}: Props) {
  const draft = useSaveFormDraft(drawer);
  const { defaultValues, canPushToConfiguredBranch, readOnly, repository, repoDataStatus, error } =
    useProvisionedDashboardData(dashboard, view, { saveAsCopy, recoverToNewBranch, ...draft });

  return (
    <ProvisionedFormGate
      isLoading={repoDataStatus === RepoViewStatus.Loading}
      isOrphaned={repoDataStatus === RepoViewStatus.Orphaned}
      isError={repoDataStatus === RepoViewStatus.Error || !defaultValues}
      error={error}
    >
      <SaveProvisionedDashboardForm
        dashboard={dashboard}
        drawer={drawer}
        changeInfo={changeInfo}
        isNew={view.isNewSave}
        defaultValues={defaultValues!}
        repository={repository}
        canPushToConfiguredBranch={canPushToConfiguredBranch}
        readOnly={readOnly}
        saveAsCopy={saveAsCopy}
        recoverToNewBranch={recoverToNewBranch}
        isHeld={view.isHeld}
      />
    </ProvisionedFormGate>
  );
}

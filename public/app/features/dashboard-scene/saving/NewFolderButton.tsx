import { useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { Button, Toggletip } from '@grafana/ui';
import { type OwnerReference } from 'app/api/clients/folder/v1beta1';
import { useCreateFolder } from 'app/api/clients/folder/v1beta1/hooks';
import { useAppNotification } from 'app/core/copy/appNotification';
import { contextSrv } from 'app/core/services/context_srv';
import { NewFolderForm } from 'app/features/browse-dashboards/components/NewFolderForm';
import { AccessControlAction } from 'app/types/accessControl';

interface Props {
  disabled?: boolean;
  /** Called with the new folder once it has been created */
  onFolderCreated: (uid: string, title: string) => void;
}

/**
 * Creates a top-level folder from the save drawer, so a dashboard can be saved into a folder that
 * doesn't exist yet without leaving the drawer.
 */
export function NewFolderButton({ disabled, onFolderCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [createFolder] = useCreateFolder();
  const notifyApp = useAppNotification();

  if (!contextSrv.hasPermission(AccessControlAction.FoldersCreate)) {
    return null;
  }

  const onCreateFolder = async (folderName: string, teamOwnerRefs?: OwnerReference[]) => {
    const result = await createFolder({ title: folderName, teamOwnerReferences: teamOwnerRefs });

    if (result.error || !result.data) {
      notifyApp.error(t('dashboard-scene.new-folder-button.create-error', 'Failed to create folder'));
      return;
    }

    reportInteraction('grafana_dashboard_save_drawer_folder_created');
    notifyApp.success(t('dashboard-scene.new-folder-button.create-success', 'Folder created'));
    onFolderCreated(result.data.uid, result.data.title);
    setIsOpen(false);
  };

  return (
    <Toggletip
      title={t('dashboard-scene.new-folder-button.title', 'New folder')}
      content={<NewFolderForm onConfirm={onCreateFolder} onCancel={() => setIsOpen(false)} />}
      placement="bottom-end"
      show={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    >
      <Button icon="plus" size="sm" fill="text" variant="secondary" disabled={disabled}>
        <Trans i18nKey="dashboard-scene.new-folder-button.label">New folder</Trans>
      </Button>
    </Toggletip>
  );
}

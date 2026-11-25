import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { Alert, Button, Stack } from '@grafana/ui';
import { useAppNotification } from 'app/core/copy/appNotification';
import { getMessageFromError } from 'app/core/utils/errors';

import { type SaveDashboardDrawer } from '../saving/SaveDashboardDrawer';
import { MAX_SAVE_MESSAGE_LENGTH, SaveMessageField, SaveMessageLengthAlert } from '../saving/SaveFormFields';
import { type DashboardChangeInfo, SaveButton, SaveConflictAlert, SaveFormActions } from '../saving/shared';
import { type DashboardScene } from '../scene/DashboardScene';

import { getScenePendingChangePreview, isPendingChangesStale, previewedDashboardUid } from './pendingChangePreview';
import { hasUnrecordedPendingChange, pendingChangesSuperseded } from './pendingChangesHistory';
import { savePendingChanges, showSavedPendingChanges } from './pendingChangesSave';

interface Props {
  dashboard: DashboardScene;
  drawer: SaveDashboardDrawer;
  changeInfo: DashboardChangeInfo;
}

/**
 * The save form for pending changes to a saved dashboard: Save saves them through the plugin that
 * keeps them. Once someone saved the dashboard since they started, Save overwrites that save, or the
 * plugin brings them up to date.
 */
export function SavePendingChangesForm({ dashboard, drawer, changeInfo }: Props) {
  const notifyApp = useAppNotification();
  const preview = getScenePendingChangePreview(dashboard.state);
  const [message, setMessage] = useState('');
  const [stale, setStale] = useState(() => (preview ? isPendingChangesStale(preview) : false));

  const [state, onSave] = useAsyncFn(
    async (force: boolean) => {
      const result = await savePendingChanges(dashboard, { force, message });
      if (!result.saved) {
        if (result.currentGeneration !== undefined) {
          setStale(true);
        } else if (pendingChangesSuperseded(dashboard)) {
          // The pending changes changed under an edit: the page shows the newer ones instead.
          dashboard.closeModal();
        }
        // Otherwise an edit failed to record, as its own error says: Save tries it again.
        return;
      }
      const uid = previewedDashboardUid(dashboard.state);
      notifyApp.success(t('dashboard-scene.use-save-dashboard.message-dashboard-saved', 'Dashboard saved'));
      dashboard.closeModal();
      dashboard.setState({ isDirty: false });
      drawer.state.onSaveSuccess?.();
      // An embedded view's host shows the saved dashboard itself, from onSaveSuccess.
      if (uid && !dashboard.state.meta.isEmbedded) {
        await showSavedPendingChanges(dashboard, uid);
      }
    },
    [dashboard, drawer, message, notifyApp]
  );

  const messageLength = message.length;
  const messageTooLong = messageLength > MAX_SAVE_MESSAGE_LENGTH;
  // An edit not recorded yet isn't in the changes shown, but Save records it first.
  const unrecorded = dashboard.hasUnrecordedEdits() || hasUnrecordedPendingChange(dashboard);
  const saveButton = (overwrite: boolean) => (
    <SaveButton
      isValid={(changeInfo.hasChanges || overwrite || unrecorded) && !messageTooLong}
      isLoading={state.loading}
      onSave={onSave}
      overwrite={overwrite}
    />
  );
  const update = preview?.pending.update;

  return (
    <Stack gap={2} direction="column">
      <SaveMessageField value={message} onChange={setMessage} />
      {messageTooLong && <SaveMessageLengthAlert messageLength={messageLength} />}
      {state.error && (
        <Alert title={t('dashboard-scene.lifecycle.save-failed', "Couldn't save the changes")} severity="error">
          {getMessageFromError(state.error)}
        </Alert>
      )}
      {stale ? (
        <SaveConflictAlert>
          <SaveFormActions drawer={drawer} saveButton={saveButton(true)}>
            {update && (
              <Button
                variant="secondary"
                onClick={() => {
                  drawer.onClose();
                  update();
                }}
              >
                <Trans i18nKey="dashboard-scene.lifecycle.ask-assistant-to-update">Ask Assistant to update</Trans>
              </Button>
            )}
          </SaveFormActions>
        </SaveConflictAlert>
      ) : (
        <SaveFormActions
          drawer={drawer}
          saveButton={saveButton(false)}
          showNoChanges={!changeInfo.hasChanges && !unrecorded}
        />
      )}
    </Stack>
  );
}

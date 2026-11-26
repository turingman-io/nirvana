import { useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { Badge, Box, ConfirmModal, ToolbarButton } from '@grafana/ui';

import { savesPendingChanges } from '../../../lifecycle/pendingChangesSave';
import { dashboardModesEnabled } from '../../dashboardModes';
import { type ToolbarActionProps } from '../types';

/**
 * Shows that the dashboard being edited has changes that are not saved yet, with quick access to
 * reviewing them and to going back to the last saved version.
 */
export function UnsavedChangesControls({ dashboard }: ToolbarActionProps) {
  const { isEditing, isDirty, uid, editPanel } = dashboard.useState();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Dashboard modes have their own "View changes" and "Discard changes" in the save menu.
  if (dashboardModesEnabled() || !isEditing || editPanel || !uid) {
    return null;
  }

  // Pending changes are unsaved changes until Save saves them.
  if (!isDirty && !savesPendingChanges(dashboard)) {
    return null;
  }

  return (
    <Box display="flex" alignItems="center" gap={1} marginBottom={1}>
      <Badge
        color="orange"
        icon="exclamation-circle"
        text={t('dashboard.toolbar.unsaved-changes.label', 'Unsaved changes')}
      />
      <ToolbarButton
        variant="canvas"
        icon="code-branch"
        tooltip={t('dashboard.toolbar.unsaved-changes.view-tooltip', 'Compare with the last saved version')}
        onClick={() => dashboard.openChanges()}
      >
        <Trans i18nKey="dashboard.toolbar.unsaved-changes.view">View changes</Trans>
      </ToolbarButton>
      <ToolbarButton
        variant="canvas"
        icon="trash-alt"
        tooltip={t('dashboard.toolbar.unsaved-changes.discard-tooltip', 'Go back to the last saved version')}
        onClick={() => setConfirmDiscard(true)}
      >
        <Trans i18nKey="dashboard.toolbar.unsaved-changes.discard">Discard changes</Trans>
      </ToolbarButton>
      <ConfirmModal
        isOpen={confirmDiscard}
        title={t('dashboard.toolbar.unsaved-changes.discard-title', 'Discard unsaved changes?')}
        body={t(
          'dashboard.toolbar.unsaved-changes.discard-body',
          'The dashboard goes back to its last saved version. You stay in edit mode.'
        )}
        confirmText={t('dashboard.toolbar.unsaved-changes.discard-confirm', 'Discard changes')}
        onConfirm={() => {
          setConfirmDiscard(false);
          dashboard.discardChangesAndKeepEditing();
        }}
        onDismiss={() => setConfirmDiscard(false)}
      />
    </Box>
  );
}

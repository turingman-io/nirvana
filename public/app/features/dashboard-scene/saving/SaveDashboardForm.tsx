import { useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { Checkbox, Stack, Alert, Box } from '@grafana/ui';

import { type DashboardScene } from '../scene/DashboardScene';

import { type SaveDashboardDrawer } from './SaveDashboardDrawer';
import { MAX_SAVE_MESSAGE_LENGTH, SaveMessageField, SaveMessageLengthAlert } from './SaveFormFields';
import { getSaveDashboardErrorInfo } from './saveErrors';
import { getSaveDashboardFormDefaults } from './saveFormDefaults';
import {
  type DashboardChangeInfo,
  SaveButton,
  SaveConflictAlert,
  SaveDashboardErrorAlert,
  SaveFormActions,
} from './shared';
import { useSaveDashboard } from './useSaveDashboard';

export interface Props {
  dashboard: DashboardScene;
  drawer: SaveDashboardDrawer;
  changeInfo: DashboardChangeInfo;
}

export function SaveDashboardForm({ dashboard, drawer, changeInfo }: Props) {
  const { hasChanges, hasMigratedToV2, changedSaveModel } = changeInfo;

  const { state, onSaveDashboard } = useSaveDashboard(false);
  const [options, setOptions] = useState(() => getSaveDashboardFormDefaults(dashboard));

  const onSave = async (overwrite: boolean) => {
    // Re-merge annotations at save time so denylist edits after the form mounted still persist.
    const latestK8s = dashboard.serializer.getK8SMetadata();
    const result = await onSaveDashboard(dashboard, {
      ...options,
      k8s: {
        ...latestK8s,
        ...options.k8s,
        annotations: {
          ...latestK8s?.annotations,
          ...options.k8s?.annotations,
          ...dashboard.state.meta.k8s?.annotations,
        },
      },
      rawDashboardJSON: changedSaveModel,
      overwrite,
    });
    if (result.status === 'success') {
      dashboard.closeModal();
      drawer.state.onSaveSuccess?.();
    }
  };

  const saveButton = (overwrite: boolean) => (
    <SaveButton isValid={hasChanges} isLoading={state.loading} onSave={onSave} overwrite={overwrite} />
  );

  function renderFooter(error?: Error) {
    const messageLength = options.message?.length ?? 0;
    if (messageLength > MAX_SAVE_MESSAGE_LENGTH) {
      return <SaveMessageLengthAlert messageLength={messageLength} />;
    }

    const errorInfo = getSaveDashboardErrorInfo(error);

    if (errorInfo?.kind === 'version-mismatch') {
      return (
        <SaveConflictAlert message={errorInfo.message}>
          <SaveFormActions drawer={drawer} saveButton={saveButton(true)} />
        </SaveConflictAlert>
      );
    }

    if (errorInfo?.kind === 'plugin-dashboard') {
      return (
        <Alert
          title={t('dashboard-scene.save-dashboard-form.render-footer.title-plugin-dashboard', 'Plugin dashboard')}
          severity="error"
        >
          <p>
            <Trans i18nKey="dashboard-scene.save-dashboard-form.render-footer.body-plugin-dashboard">
              Your changes will be lost when you update the plugin. Use <strong>Save as</strong> to create custom
              version.
            </Trans>
          </p>
          <Box paddingTop={2}>
            <SaveFormActions drawer={drawer} saveButton={saveButton(true)} />
          </Box>
        </Alert>
      );
    }

    // Everything else, `already-exists` included, keeps Save and Cancel. This form has no title or
    // folder field, so the "pick a different name or folder" alert would be unactionable advice
    // that also replaced the footer, leaving the user no way to retry.
    return (
      <>
        {errorInfo && <SaveDashboardErrorAlert info={errorInfo} />}
        <SaveFormActions drawer={drawer} saveButton={saveButton(false)} showNoChanges={!hasChanges} />
      </>
    );
  }

  return (
    <Stack gap={2} direction="column">
      <SaveDashboardFormCommonOptions drawer={drawer} changeInfo={changeInfo} />
      {hasMigratedToV2 && (
        <Alert
          title={t(
            'dashboard-scene.save-dashboard-form.title-dashboard-drastically-changed',
            'Dashboard irreversibly changed'
          )}
          severity="warning"
        >
          <p>
            <Trans i18nKey="dashboard-scene.save-dashboard-form.body-dashboard-drastically-changed">
              The dashboard will be saved using the new experimental Grafana dashboard schema. This action can’t be
              reverted and could result in the irreversible loss of data. We recommend that you save this dashboard as a
              copy instead. If you’re seeing this message in a production environment, contact Support to have the
              feature disabled.
            </Trans>
          </p>
        </Alert>
      )}
      <SaveMessageField value={options.message ?? ''} onChange={(message) => setOptions({ ...options, message })} />
      {renderFooter(state.error)}
    </Stack>
  );
}

export interface SaveDashboardFormCommonOptionsProps {
  drawer: SaveDashboardDrawer;
  changeInfo: DashboardChangeInfo;
}

export function SaveDashboardFormCommonOptions({ drawer, changeInfo }: SaveDashboardFormCommonOptionsProps) {
  const {
    saveVariables = false,
    saveTimeRange = false,
    saveRefresh = false,
    showVariablesWarning = false,
  } = drawer.useState();
  const { hasTimeChanges, hasVariableValueChanges, hasRefreshChange } = changeInfo;

  return (
    <Stack direction={'column'} alignItems={'flex-start'}>
      {hasTimeChanges && (
        <Checkbox
          id="save-timerange"
          checked={saveTimeRange}
          onChange={drawer.onToggleSaveTimeRange}
          label={t(
            'dashboard-scene.save-dashboard-form-common-options.save-timerange-label-update-default-time-range',
            'Update default time range'
          )}
          description={t(
            'dashboard-scene.save-dashboard-form-common-options.save-timerange-description-current-range-default',
            'Will make current time range the new default'
          )}
          data-testid={selectors.pages.SaveDashboardModal.saveTimerange}
        />
      )}
      {hasRefreshChange && (
        <Checkbox
          id="save-refresh"
          label={t(
            'dashboard-scene.save-dashboard-form-common-options.save-refresh-label-update-default-refresh-value',
            'Update default refresh value'
          )}
          description={t(
            'dashboard-scene.save-dashboard-form-common-options.save-refresh-description-current-refresh-default',
            'Will make the current refresh the new default'
          )}
          checked={saveRefresh}
          onChange={drawer.onToggleSaveRefresh}
          data-testid={selectors.pages.SaveDashboardModal.saveRefresh}
        />
      )}
      {hasVariableValueChanges && (
        <>
          <Checkbox
            id="save-variables"
            label={t(
              'dashboard-scene.save-dashboard-form-common-options.save-variables-label-update-default-variable-values',
              'Update default variable values'
            )}
            description={t(
              'dashboard-scene.save-dashboard-form-common-options.save-variables-description-current-values-default',
              'Will make the current values the new default'
            )}
            checked={saveVariables}
            onChange={drawer.onToggleSaveVariables}
            data-testid={selectors.pages.SaveDashboardModal.saveVariables}
          />
          {saveVariables && showVariablesWarning && (
            <Alert
              data-testid={selectors.pages.SaveDashboardModal.variablesWarningAlert}
              title={t(
                'dashboard-scene.save-dashboard-form-common-options.show-variables-warning-alert-title',
                'Variable queries failed'
              )}
              severity="warning"
            >
              <Trans i18nKey="dashboard-scene.save-dashboard-form-common-options.show-variables-warning-alert-body">
                Some variables failed to load. If you keep “Update default variable values” checked, the current
                (failed) values will become the dashboard defaults. You can save anyway or uncheck the option to avoid
                storing those (failed) values.
              </Trans>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}

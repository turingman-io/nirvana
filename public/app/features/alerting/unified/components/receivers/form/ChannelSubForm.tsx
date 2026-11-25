import { sortBy } from 'lodash';
import * as React from 'react';
import { type JSX, useMemo } from 'react';
import { Controller, type FieldErrors, useFormContext } from 'react-hook-form';

import { type SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { Alert, Badge, Box, Button, Field, Select, Stack, Text } from '@grafana/ui';

import {
  type ChannelValues,
  type CloudChannelValues,
  type CommonSettingsComponentType,
  type GrafanaChannelValues,
  type ReceiverFormValues,
} from '../../../types/receiver-form';
import {
  canCreateNotifier,
  getLegacyVersionLabel,
  getOptionsForVersion,
  isDeprecated,
  isLegacyVersion,
} from '../../../utils/notifier-versions';
import { OnCallIntegrationType } from '../grafanaAppReceivers/onCall/useOnCallIntegration';

import { ChannelOptions } from './ChannelOptions';
import { CollapsibleSection } from './CollapsibleSection';
import { type Notifier } from './notifiers';
import { useIntegrationSettings } from './useIntegrationSettings';
import { getIntegrationPaths } from './util';

interface Props<R extends ChannelValues> {
  defaultValues: R;
  initialValues?: R;
  integrationIndex: number;
  notifiers: Notifier[];
  onDuplicate: () => void;
  onTest?: () => void;
  commonSettingsComponent: CommonSettingsComponentType;
  errors?: FieldErrors<R>;
  onDelete?: () => void;
  isEditable?: boolean;
  isTestable?: boolean;
  /** Contact point level permission. Only enforced for integrations that already exist, see below. */
  canModifyProtectedFields: boolean;

  customValidators?: React.ComponentProps<typeof ChannelOptions>['customValidators'];
}

export function ChannelSubForm<R extends ChannelValues>({
  defaultValues,
  initialValues,
  integrationIndex,
  onDuplicate,
  onDelete,
  onTest,
  notifiers,
  errors,
  commonSettingsComponent: CommonSettingsComponent,
  isEditable = true,
  isTestable,
  canModifyProtectedFields,
  customValidators = {},
}: Props<R>): JSX.Element {
  // The backend only checks protected fields of integrations it already knows (matched by uid),
  // so a newly added integration is free to set them
  const canEditProtectedFields = canModifyProtectedFields || !initialValues;
  const { control, watch, trigger, formState } =
    useFormContext<ReceiverFormValues<CloudChannelValues | GrafanaChannelValues>>();

  const paths = useMemo(() => getIntegrationPaths(integrationIndex), [integrationIndex]);
  const parse_mode = watch(`${paths.settingsPrefix}parse_mode`);

  // TODO I don't like integration specific code here but other ways require a bigger refactoring
  const onCallIntegrationType = watch(`${paths.settingsPrefix}integration_type`);
  const isTestAvailable = onCallIntegrationType !== OnCallIntegrationType.NewIntegration;

  const { selectedType, resetSecureField, deleteSubform } = useIntegrationSettings({
    paths,
    defaultValues,
    initialValues,
    notifiers,
  });

  const typeOptions = useMemo((): SelectableValue[] => {
    // Non-creatable notifiers (e.g., WeChat which is v0-only, or types the admin has disallowed
    // via the allowed_integrations setting) are shown as disabled options so users can see them
    // in the dropdown. The currently selected type is never disabled, so an existing integration
    // of a now-disallowed type can still be viewed and edited.
    const currentType = initialValues?.type || defaultValues.type;

    return sortBy(notifiers, ({ dto, meta }) => [meta?.order ?? 0, dto.name]).map<SelectableValue>(({ dto, meta }) => {
      const metaDisabled = meta ? !meta.enabled : false;
      const notCreatable = !canCreateNotifier(dto) && dto.type !== currentType;
      return {
        // ReactNode is supported in Select label, but types don't reflect it
        /* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */
        label: (
          <Stack alignItems="center" gap={1}>
            {dto.name}
            {meta?.badge}
          </Stack>
        ) as any,
        /* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */
        value: dto.type,
        description: meta?.description,
        isDisabled: metaDisabled || notCreatable,
      };
    });
  }, [notifiers, initialValues?.type, defaultValues.type]);

  const handleTest = async () => {
    await trigger();
    const isValid = Object.keys(formState.errors).length === 0;

    if (isValid && onTest) {
      onTest();
    }
  };

  const notifier = notifiers.find(({ dto: { type } }) => type === selectedType);
  const isTelegram = selectedType === 'telegram';
  // Grafana AM takes "None" value and maps to an empty string,
  // Cloud AM takes no value at all
  const isParseModeNone = parse_mode === 'None' || !parse_mode;
  const showTelegramWarning = isTelegram && !isParseModeNone;

  // Read version from existing integration data (stored in receiver config)
  const integrationVersion = initialValues?.version || defaultValues.version;

  // Check if integration is deprecated (will be removed in a future release)
  const notifierIsDeprecated = notifier ? isDeprecated(notifier.dto, integrationVersion) : false;

  // Check if current integration is a legacy version (old version format, e.g., v0mimir1)
  // Legacy integrations use an older schema imported from Mimir
  const isLegacy = notifier ? isLegacyVersion(notifier.dto, integrationVersion) : false;

  // Get the correct options based on the integration's version
  // This ensures legacy (v0) integrations display the correct schema
  const versionedOptions = notifier ? getOptionsForVersion(notifier.dto, integrationVersion) : [];

  // if there are mandatory options defined, optional options will be hidden by a collapse
  // if there aren't mandatory options, all options will be shown without collapse
  const mandatoryOptions = versionedOptions.filter((o) => o.required);
  const optionalOptions = versionedOptions.filter((o) => !o.required);

  const contactPointTypeInputId = `contact-point-type-${paths.prefix}`;
  return (
    <Box
      marginY={2}
      padding={2}
      borderStyle="solid"
      borderColor="medium"
      borderRadius="lg"
      data-testid="item-container"
    >
      <Stack direction="column" gap={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" wrap="wrap" gap={2}>
          <Box minWidth={0} maxWidth="100%">
            <Field
              label={t('alerting.channel-sub-form.label-integration', 'Integration')}
              htmlFor={contactPointTypeInputId}
              data-testid={selectors.pages.Alerting.ContactPointForm.integrationTypeField(paths.prefix)}
              noMargin
            >
              <Stack direction="row" alignItems="center" wrap="wrap" gap={1}>
                <Box width={37} maxWidth="100%" minWidth={0}>
                  <Controller
                    name={paths.type}
                    control={control}
                    defaultValue={defaultValues.type}
                    render={({ field: { ref, onChange, ...field } }) => (
                      <Select
                        disabled={!isEditable}
                        inputId={contactPointTypeInputId}
                        {...field}
                        options={typeOptions}
                        onChange={(value) => onChange(value?.value)}
                      />
                    )}
                  />
                </Box>
                {notifierIsDeprecated && (
                  <Badge
                    text={t('alerting.channel-sub-form.badge-deprecated', 'Deprecated')}
                    color="orange"
                    icon="exclamation-triangle"
                    tooltip={t(
                      'alerting.channel-sub-form.tooltip-deprecated',
                      'This integration is deprecated and will be removed in a future release.'
                    )}
                  />
                )}
                {isLegacy && integrationVersion && (
                  <Badge
                    text={getLegacyVersionLabel(integrationVersion)}
                    color="orange"
                    icon="exclamation-triangle"
                    tooltip={t(
                      'alerting.channel-sub-form.tooltip-legacy-version',
                      'This is a legacy integration (version: {{version}}). It cannot be modified.',
                      { version: integrationVersion }
                    )}
                  />
                )}
              </Stack>
            </Field>
          </Box>
          <Stack direction="row" wrap="wrap" gap={1}>
            {isTestable && onTest && isTestAvailable && (
              <Button size="xs" variant="secondary" type="button" onClick={() => handleTest()} icon="message">
                <Trans i18nKey="alerting.channel-sub-form.test">Test</Trans>
              </Button>
            )}
            {isEditable && (
              <>
                {/* Only show duplicate button if the notifier type can be created */}
                {notifier && canCreateNotifier(notifier.dto) && (
                  <Button size="xs" variant="secondary" type="button" onClick={() => onDuplicate()} icon="copy">
                    <Trans i18nKey="alerting.channel-sub-form.duplicate">Duplicate</Trans>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    data-testid={`${paths.prefix}delete-button`}
                    size="xs"
                    variant="secondary"
                    type="button"
                    onClick={() => onDelete()}
                    icon="trash-alt"
                  >
                    <Trans i18nKey="alerting.channel-sub-form.delete">Delete</Trans>
                  </Button>
                )}
              </>
            )}
          </Stack>
        </Stack>
        {notifier && (
          <Box width="100%" maxWidth={67}>
            {showTelegramWarning && (
              <Alert
                title={t(
                  'alerting.contact-points.telegram.parse-mode-warning-title',
                  'Telegram messages are limited to 4096 UTF-8 characters.'
                )}
                severity="warning"
              >
                <Trans i18nKey="alerting.contact-points.telegram.parse-mode-warning-body">
                  If you use a <Text variant="code">parse_mode</Text> option other than <Text variant="code">None</Text>
                  , truncation may result in an invalid message, causing the notification to fail. For longer messages,
                  we recommend using an alternative contact method.
                </Trans>
              </Alert>
            )}
            <ChannelOptions<R>
              defaultValues={defaultValues}
              selectedChannelOptions={mandatoryOptions.length ? mandatoryOptions : optionalOptions}
              errors={errors}
              onResetSecureField={resetSecureField}
              onDeleteSubform={deleteSubform}
              paths={paths}
              readOnly={!isEditable}
              canEditProtectedFields={canEditProtectedFields}
              customValidators={customValidators}
            />
            {!!(mandatoryOptions.length && optionalOptions.length) && (
              <CollapsibleSection
                label={t('alerting.channel-sub-form.label-section', 'Optional {{name}} settings', {
                  name: notifier.dto.name,
                })}
              >
                {notifier.dto.info && (
                  <Alert title="" severity="info">
                    {notifier.dto.info}
                  </Alert>
                )}
                <ChannelOptions<R>
                  defaultValues={defaultValues}
                  selectedChannelOptions={optionalOptions}
                  onResetSecureField={resetSecureField}
                  onDeleteSubform={deleteSubform}
                  errors={errors}
                  paths={paths}
                  readOnly={!isEditable}
                  canEditProtectedFields={canEditProtectedFields}
                  customValidators={customValidators}
                />
              </CollapsibleSection>
            )}
            <CollapsibleSection
              label={t('alerting.channel-sub-form.label-notification-settings', 'Notification settings')}
            >
              <CommonSettingsComponent pathPrefix={paths.prefix} readOnly={!isEditable} />
            </CollapsibleSection>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

import { useCallback, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  type ChannelValues,
  type CloudChannelValues,
  type DeleteSubformHandler,
  type GrafanaChannelValues,
  type ReceiverFormValues,
  type ResetSecureFieldHandler,
} from '../../../types/receiver-form';
import { getOptionsForVersion } from '../../../utils/notifier-versions';
import { OnCallIntegrationType } from '../grafanaAppReceivers/onCall/useOnCallIntegration';

import { type Notifier } from './notifiers';
import { type IntegrationPaths, findSecureFieldsRecursively, getSettingsFieldPath } from './util';

interface Options<R extends ChannelValues> {
  paths: IntegrationPaths;
  defaultValues: R;
  initialValues?: R;
  notifiers: Notifier[];
}

/**
 * Manages the form state of a single integration of a contact point: registers the fields that don't have an input,
 * keeps the settings in line with the selected integration type and provides the handlers the option fields use
 * to reset secure fields and to delete subforms.
 */
export function useIntegrationSettings<R extends ChannelValues>({
  paths,
  defaultValues,
  initialValues,
  notifiers,
}: Options<R>) {
  const { register, watch, getValues, setValue } =
    useFormContext<ReceiverFormValues<CloudChannelValues | GrafanaChannelValues>>();

  const selectedType = watch(paths.type) ?? defaultValues.type;

  useEffect(() => {
    register(paths.id);
    /* Need to manually register secureFields or else they'll
     be lost when testing a contact point */
    register(paths.secureFields);
  }, [register, paths]);

  // Prevent forgetting about initial values when switching the integration type and the oncall integration type
  useEffect(() => {
    // Restore values when switching back from a changed integration to the default one
    const subscription = watch((formValues, { name, type }) => {
      // @ts-expect-error name is valid key for formValues
      const value = name ? getValues(name, formValues) : '';
      if (initialValues && name === paths.type && value === initialValues.type && type === 'change') {
        setValue(paths.settings, initialValues.settings);
        setValue(paths.secureFields, initialValues.secureFields);
      } else if (name === paths.type && type === 'change') {
        // When switching to a new notifier, set the default settings to remove all existing settings
        // from the previous notifier
        const newNotifier = notifiers.find(({ dto: { type } }) => type === value);
        const defaultNotifierSettings = newNotifier ? getDefaultNotifierSettings(newNotifier) : {};

        // Not sure why, but overriding the settings path is not enough if notifiers have the same settings fields, like url, title
        const currentSettings = getValues(paths.settings) ?? {};
        Object.keys(currentSettings).forEach((key) => {
          if (!defaultNotifierSettings[key]) {
            setValue(`${paths.settingsPrefix}${key}`, defaultNotifierSettings[key]);
          }
        });

        setValue(paths.settings, defaultNotifierSettings);
        setValue(paths.secureFields, {});

        // Reset version when changing type - backend will use its default
        setValue(paths.version, undefined);
      }

      // Restore initial value of an existing oncall integration
      if (
        initialValues &&
        name === `${paths.settingsPrefix}integration_type` &&
        value === OnCallIntegrationType.ExistingIntegration
      ) {
        setValue(`${paths.settingsPrefix}url`, initialValues.settings.url);
      }
    });

    return () => subscription.unsubscribe();
  }, [
    selectedType,
    initialValues,
    setValue,
    paths,
    getValues,
    watch,
    defaultValues.settings,
    defaultValues.secureFields,
    notifiers,
  ]);

  const resetSecureField = useCallback<ResetSecureFieldHandler>(
    (secureFieldKey) => {
      // formSecureFields might not be up to date if this function is called multiple times in a row
      const currentSecureFields = getValues(paths.secureFields);
      if (currentSecureFields[secureFieldKey]) {
        setValue(paths.secureFields, { ...currentSecureFields, [secureFieldKey]: '' });
      }
    },
    [getValues, setValue, paths]
  );

  const deleteSubform = useCallback<DeleteSubformHandler>(
    (subformPath, option) => {
      // Get all subform options with secure=true recursively.
      findSecureFieldsRecursively(option.subformOptions ?? []).forEach((key) => resetSecureField(key));
      setValue(getSettingsFieldPath(paths, subformPath), undefined);
    },
    [paths, resetSecureField, setValue]
  );

  return { selectedType, resetSecureField, deleteSubform };
}

function getDefaultNotifierSettings(notifier: Notifier): Record<string, string> {
  const defaultSettings: Record<string, string> = {};
  getOptionsForVersion(notifier.dto).forEach((option) => {
    if (option.defaultValue?.value) {
      defaultSettings[option.propertyName] = option.defaultValue?.value;
    }
  });
  return defaultSettings;
}

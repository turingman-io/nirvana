import { omit } from 'lodash';

import { type NotificationChannelOption } from 'app/features/alerting/unified/types/alerting';

import { type ChannelValues, type ReceiverFormValues } from '../../../types/receiver-form';

export interface DeprecatedAuthHTTPConfig {
  bearer_token?: string;
  bearer_token_file?: string;
}

export interface HTTPAuthConfig {
  authorization?: {
    type: string;
    credentials?: string;
    credentials_file?: string;
  };
}

// convert the newer http_config to the older (deprecated) format
export function normalizeFormValues<R extends ChannelValues>(
  values?: ReceiverFormValues<R>
): ReceiverFormValues<R> | undefined {
  if (!values) {
    return;
  }

  return {
    ...values,
    items: values.items.map((item) => ({
      ...item,
      settings: {
        ...item.settings,
        http_config: item.settings?.http_config ? normalizeHTTPConfig(item.settings?.http_config) : undefined,
      },
    })),
  };
}

function normalizeHTTPConfig(config: HTTPAuthConfig | DeprecatedAuthHTTPConfig): DeprecatedAuthHTTPConfig {
  if (isDeprecatedHTTPAuthConfig(config)) {
    return config;
  }

  return {
    ...omit(config, 'authorization'),
    bearer_token: config.authorization?.credentials,
    bearer_token_file: config.authorization?.credentials_file,
  };
}

function isDeprecatedHTTPAuthConfig(
  config: HTTPAuthConfig | DeprecatedAuthHTTPConfig
): config is DeprecatedAuthHTTPConfig {
  return ['bearer_token', 'bearer_token_file'].some((prop) => prop in config);
}

/**
 * Form paths of the integration at the given index of the contact point's integrations.
 */
export function getIntegrationPaths(integrationIndex: number) {
  const integrationPath = `items.${integrationIndex}` as const;

  return {
    /** Prefix of the integration's own fields, e.g. `items.0.` for `items.0.type` */
    prefix: `${integrationPath}.` as const,
    id: `${integrationPath}.__id` as const,
    type: `${integrationPath}.type` as const,
    version: `${integrationPath}.version` as const,
    settings: `${integrationPath}.settings` as const,
    /** Prefix of the integration's option fields, e.g. `items.0.settings.` for `items.0.settings.url` */
    settingsPrefix: `${integrationPath}.settings.` as const,
    secureFields: `${integrationPath}.secureFields` as const,
  };
}

export type IntegrationPaths = ReturnType<typeof getIntegrationPaths>;

/**
 * Resolves the path of an option field to its full path in the integration's settings.
 * Accepts both full paths (`items.0.settings.tlsConfig`) and paths relative to the settings (`tlsConfig`).
 */
export function getSettingsFieldPath(paths: IntegrationPaths, fieldPath: string) {
  const relativePath = fieldPath.startsWith(paths.settingsPrefix)
    ? fieldPath.slice(paths.settingsPrefix.length)
    : fieldPath;

  return `${paths.settingsPrefix}${relativePath}` as const;
}

/**
 * Collects the secure field keys of the given options, including the ones of options nested in subforms.
 */
export function findSecureFieldsRecursively(options: NotificationChannelOption[]): string[] {
  const secureFields: string[] = [];
  options?.forEach((option) => {
    if (option.secure && option.secureFieldKey) {
      secureFields.push(option.secureFieldKey);
    }
    if (option.subformOptions) {
      secureFields.push(...findSecureFieldsRecursively(option.subformOptions));
    }
  });
  return secureFields;
}

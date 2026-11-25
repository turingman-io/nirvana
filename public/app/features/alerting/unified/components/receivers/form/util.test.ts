import { type NotificationChannelOption } from 'app/features/alerting/unified/types/alerting';

import { type ChannelValues, type ReceiverFormValues } from '../../../types/receiver-form';

import { matchesOnlyOneTemplate } from './fields/utils';
import {
  type DeprecatedAuthHTTPConfig,
  type HTTPAuthConfig,
  findSecureFieldsRecursively,
  getIntegrationPaths,
  getSettingsFieldPath,
  normalizeFormValues,
} from './util';

describe('normalizeFormValues', () => {
  it('should leave the older config alone', () => {
    const config = createContactPoint({ bearer_token: 'token' });
    expect(normalizeFormValues(config)).toEqual(config);
  });

  it('should leave the older config alone', () => {
    const config = createContactPoint({ bearer_token_file: 'file' });
    expect(normalizeFormValues(config)).toEqual(config);
  });

  it('should normalize newer config', () => {
    const config = createContactPoint({
      authorization: {
        type: 'bearer',
        credentials: 'token',
      },
    });

    expect(normalizeFormValues(config)).toEqual(createContactPoint({ bearer_token: 'token' }));
  });

  it('should normalize newer config', () => {
    const config = createContactPoint({
      authorization: {
        type: 'bearer',
        credentials_file: 'file',
      },
    });

    expect(normalizeFormValues(config)).toEqual(createContactPoint({ bearer_token_file: 'file' }));
  });

  it('should normalize even if authorization is not defined', () => {
    const config = createContactPoint({});
    expect(normalizeFormValues(config)).toEqual(createContactPoint({}));
  });
});

function createContactPoint(httpConfig: DeprecatedAuthHTTPConfig | HTTPAuthConfig) {
  const config: ReceiverFormValues<ChannelValues> = {
    name: 'My Contact Point',
    items: [
      {
        __id: '',
        type: '',
        secureFields: {},
        settings: {
          http_config: {
            ...httpConfig,
          },
        },
      },
    ],
  };

  return config;
}

describe('matchesOnlyOneTemplate', () => {
  it('should return true when there is only one template and no other text', () => {
    const fieldValue = '{{ template "nested" . }}';
    expect(matchesOnlyOneTemplate(fieldValue)).toBe(true);
  });

  it('should return false when there is more than one template', () => {
    const fieldValue = '{{ template "nested" . }}{{ template "nested2" . }}';
    expect(matchesOnlyOneTemplate(fieldValue)).toBe(false);
  });

  it('should return false when there is other text outside the template', () => {
    const fieldValue = '{{ template "nested" . }} some other text';
    expect(matchesOnlyOneTemplate(fieldValue)).toBe(false);
  });

  it('should return false when there is no template', () => {
    const fieldValue = 'some other text';
    expect(matchesOnlyOneTemplate(fieldValue)).toBe(false);
  });
});

describe('getIntegrationPaths', () => {
  it('should return the form paths of the integration at the given index', () => {
    expect(getIntegrationPaths(2)).toEqual({
      prefix: 'items.2.',
      id: 'items.2.__id',
      type: 'items.2.type',
      version: 'items.2.version',
      settings: 'items.2.settings',
      settingsPrefix: 'items.2.settings.',
      secureFields: 'items.2.secureFields',
    });
  });
});

describe('getSettingsFieldPath', () => {
  const paths = getIntegrationPaths(1);

  it('should keep a full path of the integration settings', () => {
    expect(getSettingsFieldPath(paths, 'items.1.settings.tlsConfig')).toBe('items.1.settings.tlsConfig');
  });

  it('should keep a full path of a nested field', () => {
    expect(getSettingsFieldPath(paths, 'items.1.settings.http_config.oauth2.tls_config')).toBe(
      'items.1.settings.http_config.oauth2.tls_config'
    );
  });

  it('should resolve a path relative to the integration settings', () => {
    expect(getSettingsFieldPath(paths, 'tlsConfig')).toBe('items.1.settings.tlsConfig');
  });
});

describe('findSecureFieldsRecursively', () => {
  it('should return the secure field keys of the options and of their subforms', () => {
    const options = [
      createOption({ propertyName: 'url' }),
      createOption({ propertyName: 'password', secure: true, secureFieldKey: 'password' }),
      createOption({
        propertyName: 'http_config',
        element: 'subform',
        subformOptions: [
          createOption({
            propertyName: 'oauth2',
            element: 'subform',
            subformOptions: [
              createOption({ propertyName: 'client_id' }),
              createOption({
                propertyName: 'client_secret',
                secure: true,
                secureFieldKey: 'http_config.oauth2.client_secret',
              }),
            ],
          }),
        ],
      }),
    ];

    expect(findSecureFieldsRecursively(options)).toEqual(['password', 'http_config.oauth2.client_secret']);
  });

  it('should skip secure options without a secure field key', () => {
    expect(findSecureFieldsRecursively([createOption({ propertyName: 'token', secure: true })])).toEqual([]);
  });
});

function createOption(overrides: Partial<NotificationChannelOption> = {}): NotificationChannelOption {
  return {
    element: 'input',
    inputType: 'text',
    label: 'Option',
    description: '',
    placeholder: '',
    propertyName: 'option',
    required: false,
    secure: false,
    showWhen: { field: '', is: '' },
    validationRule: '',
    dependsOn: '',
    ...overrides,
  };
}

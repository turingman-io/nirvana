import { type PropsWithChildren } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { act, renderHook } from 'test/test-utils';

import { grafanaAlertNotifiers } from 'app/features/alerting/unified/mockGrafanaNotifiers';

import { type GrafanaChannelValues, type ReceiverFormValues } from '../../../types/receiver-form';

import { type Notifier } from './notifiers';
import { useIntegrationSettings } from './useIntegrationSettings';
import { getIntegrationPaths } from './util';

const notifiers: Notifier[] = [
  { dto: grafanaAlertNotifiers.webhook, meta: { enabled: true, order: 1 } },
  { dto: grafanaAlertNotifiers.slack, meta: { enabled: true, order: 2 } },
];

function createIntegration(overrides: Partial<GrafanaChannelValues> = {}): GrafanaChannelValues {
  return {
    __id: 'integration-0',
    type: 'slack',
    settings: { recipient: '#alerts' },
    secureFields: {},
    ...overrides,
  };
}

function renderIntegrationSettings(integrations: GrafanaChannelValues[], integrationIndex = 0) {
  const paths = getIntegrationPaths(integrationIndex);

  function FormWrapper({ children }: PropsWithChildren) {
    const form = useForm<ReceiverFormValues<GrafanaChannelValues>>({
      defaultValues: { name: 'my contact point', items: integrations },
    });

    return <FormProvider {...form}>{children}</FormProvider>;
  }

  return renderHook(
    () => ({
      form: useFormContext<ReceiverFormValues<GrafanaChannelValues>>(),
      settings: useIntegrationSettings({
        paths,
        defaultValues: integrations[integrationIndex],
        initialValues: integrations[integrationIndex],
        notifiers,
      }),
    }),
    { wrapper: FormWrapper }
  );
}

describe('useIntegrationSettings', () => {
  it('should return the selected type of the integration', () => {
    const { result } = renderIntegrationSettings(
      [
        createIntegration(),
        createIntegration({ __id: 'integration-1', type: 'webhook', settings: { url: 'https://example.com' } }),
      ],
      1
    );

    expect(result.current.settings.selectedType).toBe('webhook');
  });

  describe('resetSecureField', () => {
    it('should clear a configured secure field and keep the other ones', () => {
      const { result } = renderIntegrationSettings([createIntegration({ secureFields: { token: true, url: true } })]);

      act(() => result.current.settings.resetSecureField('token'));

      expect(result.current.form.getValues('items.0.secureFields')).toEqual({ token: '', url: true });
    });

    it('should keep all secure fields when the given one is not configured', () => {
      const { result } = renderIntegrationSettings([createIntegration({ secureFields: { url: true } })]);

      act(() => result.current.settings.resetSecureField('token'));

      expect(result.current.form.getValues('items.0.secureFields')).toEqual({ url: true });
    });

    it('should clear every secure field when several are reset in a row', () => {
      const { result } = renderIntegrationSettings([createIntegration({ secureFields: { token: true, url: true } })]);

      act(() => {
        result.current.settings.resetSecureField('token');
        result.current.settings.resetSecureField('url');
      });

      expect(result.current.form.getValues('items.0.secureFields')).toEqual({ token: '', url: '' });
    });

    it('should only clear the secure fields of its own integration', () => {
      const { result } = renderIntegrationSettings(
        [
          createIntegration({ secureFields: { token: true } }),
          createIntegration({ __id: 'integration-1', secureFields: { token: true } }),
        ],
        1
      );

      act(() => result.current.settings.resetSecureField('token'));

      expect(result.current.form.getValues('items.0.secureFields')).toEqual({ token: true });
      expect(result.current.form.getValues('items.1.secureFields')).toEqual({ token: '' });
    });
  });
});

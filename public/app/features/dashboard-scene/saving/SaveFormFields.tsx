import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { Trans, t } from '@grafana/i18n';
import { Alert, Field, Switch, TextArea } from '@grafana/ui';

/** The version history keeps a message up to this long. */
export const MAX_SAVE_MESSAGE_LENGTH = 500;

interface SaveMessageFieldProps {
  value: string;
  onChange: (message: string) => void;
}

/** The note a save records in the version history */
export function SaveMessageField({ value, onChange }: SaveMessageFieldProps) {
  return (
    <Field label={t('dashboard-scene.save-dashboard-form.label-message', 'Message')} noMargin>
      <TextArea
        aria-label={t('dashboard-scene.save-dashboard-form.aria-label-message', 'message')}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={t(
          'dashboard-scene.save-dashboard-form.placeholder-describe-changes-optional',
          'Add a note to describe your changes (optional).'
        )}
        autoFocus
        rows={5}
      />
    </Field>
  );
}

export function SaveMessageLengthAlert({ messageLength }: { messageLength: number }) {
  return (
    <Alert title={t('save-dashboards.message-length.title', 'Message too long')} severity="error">
      <p>
        <Trans i18nKey="save-dashboards.message-length.info">
          The message is {{ messageLength }} characters, which exceeds the maximum length of 500 characters. Please
          shorten it before saving.
        </Trans>
      </p>
    </Alert>
  );
}

/** The Copy tags switch of the forms that save a dashboard under a new name */
export const CopyTagsField = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof Switch>>(
  function CopyTagsField(props, ref) {
    return (
      <Field noMargin label={t('dashboard-scene.save-dashboard-as-form.label-copy-tags', 'Copy tags')}>
        <Switch {...props} ref={ref} />
      </Field>
    );
  }
);

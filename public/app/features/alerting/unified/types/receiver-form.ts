import type * as React from 'react';

import {
  type CloudNotifierType,
  type NotificationChannelOption,
  type NotifierType,
} from 'app/features/alerting/unified/types/alerting';
import { type GrafanaManagedReceiverConfig } from 'app/plugins/datasource/alertmanager/types';

import { type ControlledField } from '../hooks/useControlledFieldArray';

export interface ChannelValues {
  __id: string; // used to correlate form values to original DTOs
  type: string;
  version?: string; // Integration version (e.g. "v0" for Mimir legacy, "v1" for Grafana)
  settings: Record<string, any>;
  secureFields: Record<string, boolean | ''>;
}

export interface ReceiverFormValues<R extends ChannelValues> {
  name: string;
  items: Array<ControlledField<R>>;
}

export interface CloudChannelValues extends ChannelValues {
  type: string;
  sendResolved: boolean;
}

export interface GrafanaChannelValues extends ChannelValues {
  type: NotifierType;
  provenance?: string;
  disableResolveMessage?: boolean;
}

export interface CommonSettingsComponentProps {
  pathPrefix: string;
  className?: string;
  readOnly?: boolean;
}
export type CommonSettingsComponentType = React.ComponentType<CommonSettingsComponentProps>;

/** Clears a configured secure field of an integration, so that a new value can be entered */
export type ResetSecureFieldHandler = (secureFieldKey: string) => void;
/** Deletes a subform of an integration's settings, given the form path of the subform */
export type DeleteSubformHandler = (subformPath: string, option: NotificationChannelOption) => void;

export type CloudChannelConfig = {
  send_resolved: boolean;
  [key: string]: unknown;
};

// id to notifier
export type GrafanaChannelMap = Record<string, GrafanaManagedReceiverConfig>;
export type CloudChannelMap = Record<
  string,
  {
    type: CloudNotifierType;
    config: CloudChannelConfig;
  }
>;

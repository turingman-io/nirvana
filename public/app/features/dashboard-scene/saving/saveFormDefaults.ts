import { type SaveDashboardOptions } from 'app/features/dashboard/components/SaveDashboard/types';

import { type DashboardScene } from '../scene/DashboardScene';

import { type SaveFormDraft } from './SaveDashboardDrawer';
import { type DashboardChangeInfo } from './shared';

export interface SaveDashboardAsFormDTO {
  title: string;
  description: string;
  folder: { uid?: string; title?: string };
  copyTags: boolean;
}

/** The title a copy of a dashboard is first offered under */
export function getDashboardCopyTitle(title: string | undefined): string {
  return `${title} Copy`;
}

/**
 * What the save form starts with. The uid has to come from the k8s metadata, as a v2 spec has none,
 * and meta.k8s.annotations is the editor source of truth for the denylist and other client annotations.
 */
export function getSaveDashboardFormDefaults(dashboard: DashboardScene): SaveDashboardOptions {
  const { meta } = dashboard.state;
  const k8s = dashboard.serializer.getK8SMetadata();

  return {
    folderUid: meta.folderUid,
    k8s: { ...k8s, annotations: { ...k8s?.annotations, ...meta.k8s?.annotations } },
  };
}

/**
 * What the save-as form starts with. A draft is what the form it replaced showed, and wins over the
 * title and description of the dashboard being saved; the folder is the one the save is headed to.
 */
export function getSaveAsFormDefaults(
  dashboard: DashboardScene,
  { changedSaveModel, isNew }: DashboardChangeInfo,
  draft?: SaveFormDraft
): SaveDashboardAsFormDTO {
  const { folderUid, folderTitle } = dashboard.state.meta;

  return {
    title: draft?.title ?? (isNew ? changedSaveModel.title! : getDashboardCopyTitle(changedSaveModel.title)),
    description: draft?.description ?? changedSaveModel.description ?? '',
    folder: { uid: folderUid, title: folderTitle },
    copyTags: false,
  };
}

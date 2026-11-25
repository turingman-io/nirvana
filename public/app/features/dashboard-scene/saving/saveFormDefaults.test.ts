import { AnnoKeyCreatedBy, AnnoKeyUseCrossDashboardVariables } from 'app/features/apiserver/types';

import { DashboardScene } from '../scene/DashboardScene';

import { getSaveAsFormDefaults, getSaveDashboardFormDefaults } from './saveFormDefaults';
import { type DashboardChangeInfo } from './shared';

function savedDashboardChanges(): DashboardChangeInfo {
  return {
    changedSaveModel: { title: 'Service overview', description: 'Latency and errors', schemaVersion: 41 },
    initialSaveModel: { title: 'Service overview', description: 'Latency and errors', schemaVersion: 41 },
    diffs: {},
    diffCount: 0,
    hasChanges: false,
    hasTimeChanges: false,
    hasVariableValueChanges: false,
    hasRefreshChange: false,
    isNew: false,
  };
}

describe('getSaveAsFormDefaults', () => {
  const dashboard = new DashboardScene({
    title: 'Service overview',
    uid: 'service-overview',
    meta: { folderUid: 'team-a', folderTitle: 'Team A' },
  });

  it('offers a saved dashboard as a copy under the copy title, in its folder', () => {
    expect(getSaveAsFormDefaults(dashboard, savedDashboardChanges())).toEqual({
      title: 'Service overview Copy',
      description: 'Latency and errors',
      folder: { uid: 'team-a', title: 'Team A' },
      copyTags: false,
    });
  });

  it('starts from the title and description the replaced form showed', () => {
    const draft = { title: 'Service overview (staging)', description: '' };

    expect(getSaveAsFormDefaults(dashboard, savedDashboardChanges(), draft)).toMatchObject(draft);
  });
});

describe('getSaveDashboardFormDefaults', () => {
  it('lays the annotations edited in the dashboard over its stored k8s metadata', () => {
    const dashboard = new DashboardScene({
      title: 'Service overview',
      uid: 'service-overview',
      meta: {
        folderUid: 'team-a',
        k8s: { annotations: { [AnnoKeyUseCrossDashboardVariables]: '{"global":"all","folder":"none"}' } },
      },
    });
    jest.spyOn(dashboard.serializer, 'getK8SMetadata').mockReturnValue({
      name: 'service-overview',
      resourceVersion: '7',
      annotations: { [AnnoKeyCreatedBy]: 'user:1', [AnnoKeyUseCrossDashboardVariables]: '{"global":"all"}' },
    });

    expect(getSaveDashboardFormDefaults(dashboard)).toEqual({
      folderUid: 'team-a',
      k8s: {
        name: 'service-overview',
        resourceVersion: '7',
        annotations: {
          [AnnoKeyCreatedBy]: 'user:1',
          [AnnoKeyUseCrossDashboardVariables]: '{"global":"all","folder":"none"}',
        },
      },
    });
  });
});

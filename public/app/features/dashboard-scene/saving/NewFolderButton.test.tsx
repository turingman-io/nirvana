import { render, screen, waitFor } from 'test/test-utils';

import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { NewFolderButton } from './NewFolderButton';

const mockCreateFolder = jest.fn();

jest.mock('app/api/clients/folder/v1beta1/hooks', () => ({
  ...jest.requireActual('app/api/clients/folder/v1beta1/hooks'),
  useCreateFolder: () => [mockCreateFolder],
}));

jest.mock('app/features/manage-dashboards/services/ValidationSrv', () => ({
  validationSrv: {
    validateNewFolderName: jest.fn().mockResolvedValue(true),
  },
}));

function setup() {
  const onFolderCreated = jest.fn();
  const result = render(<NewFolderButton onFolderCreated={onFolderCreated} />);
  return { ...result, onFolderCreated };
}

async function createFolder(user: ReturnType<typeof setup>['user'], name: string) {
  await user.click(screen.getByRole('button', { name: 'New folder' }));
  await user.type(await screen.findByRole('textbox', { name: 'Folder name' }), name);
  await user.click(screen.getByRole('button', { name: 'Create' }));
}

describe('NewFolderButton', () => {
  beforeEach(() => {
    jest
      .spyOn(contextSrv, 'hasPermission')
      .mockImplementation((action) => action === AccessControlAction.FoldersCreate);
    mockCreateFolder.mockResolvedValue({ data: { uid: 'new-folder-uid', title: 'Team dashboards' } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockCreateFolder.mockReset();
  });

  it('is not rendered when the user cannot create folders', () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);
    setup();

    expect(screen.queryByRole('button', { name: 'New folder' })).not.toBeInTheDocument();
  });

  it('creates the folder and passes it on', async () => {
    const { user, onFolderCreated } = setup();

    await createFolder(user, 'Team dashboards');

    await waitFor(() => expect(onFolderCreated).toHaveBeenCalledWith('new-folder-uid', 'Team dashboards'));
    expect(mockCreateFolder).toHaveBeenCalledWith({ title: 'Team dashboards', teamOwnerReferences: [] });
    expect(screen.queryByRole('textbox', { name: 'Folder name' })).not.toBeInTheDocument();
  });

  it('keeps the form open when the folder cannot be created', async () => {
    mockCreateFolder.mockResolvedValue({ error: new Error('Folder already exists') });
    const { user, onFolderCreated } = setup();

    await createFolder(user, 'Team dashboards');

    await waitFor(() => expect(mockCreateFolder).toHaveBeenCalled());
    expect(onFolderCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Folder name' })).toHaveValue('Team dashboards');
  });
});

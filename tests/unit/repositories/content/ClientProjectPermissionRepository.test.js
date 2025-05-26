const { ClientProjectPermissionRepository } = require('../../../../src/data/repositories/content');
const { ClientProjectPermission } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  ClientProjectPermission: {
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async create(data) {
      return { id: 1, ...data };
    }
  };
});

describe('ClientProjectPermissionRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ClientProjectPermissionRepository();
    jest.clearAllMocks();
  });

  test('getByAssignmentId should call findOne with correct parameters', async () => {
    const assignmentId = 5;
    const mockPermission = { id: 1, assignment_id: assignmentId };
    ClientProjectPermission.findOne.mockResolvedValue(mockPermission);
    
    const result = await repository.getByAssignmentId(assignmentId);
    
    expect(ClientProjectPermission.findOne).toHaveBeenCalledWith({
      where: { assignment_id: assignmentId }
    });
    expect(result).toEqual(mockPermission);
  });

  test('updatePermissions should call update with correct parameters', async () => {
    const assignmentId = 5;
    const permissions = { can_view_files: true, can_download: false };
    const updateResult = [1]; // Number of rows affected
    ClientProjectPermission.update.mockResolvedValue(updateResult);
    
    const result = await repository.updatePermissions(assignmentId, permissions);
    
    expect(ClientProjectPermission.update).toHaveBeenCalledWith(
      permissions,
      { where: { assignment_id: assignmentId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('createDefaultPermissions should call create with correct parameters', async () => {
    const assignmentId = 5;
    const expectedPermissions = {
      assignment_id: assignmentId,
      can_view_files: true,
      can_view_updates: true,
      can_download: true,
      can_message: true,
      can_view_invoices: false,
      can_make_payments: false,
      can_invite_collaborators: false
    };
    
    // Mock the create method
    repository.create = jest.fn().mockResolvedValue({ id: 1, ...expectedPermissions });
    
    const result = await repository.createDefaultPermissions(assignmentId);
    
    expect(repository.create).toHaveBeenCalledWith(expectedPermissions);
    expect(result).toEqual({ id: 1, ...expectedPermissions });
  });
}); 
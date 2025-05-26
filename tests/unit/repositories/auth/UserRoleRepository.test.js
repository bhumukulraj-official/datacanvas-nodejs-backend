const UserRoleRepository = require('../../../../src/data/repositories/auth/UserRoleRepository');
const { UserRole } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  UserRole: {
    findAll: jest.fn()
  }
}));

describe('UserRoleRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new UserRoleRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(UserRole);
  });

  test('getActiveRoles should call findAll with correct parameters', async () => {
    const mockRoles = [
      { id: 1, name: 'admin', is_active: true },
      { id: 2, name: 'user', is_active: true }
    ];
    UserRole.findAll.mockResolvedValue(mockRoles);

    const result = await repository.getActiveRoles();
    
    expect(UserRole.findAll).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(result).toEqual(mockRoles);
  });
}); 
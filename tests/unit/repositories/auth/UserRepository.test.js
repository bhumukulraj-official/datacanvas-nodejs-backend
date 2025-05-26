const UserRepository = require('../../../../src/data/repositories/auth/UserRepository');
const { User } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('UserRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new UserRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(User);
  });

  test('findByEmail should call findOne with correct parameters', async () => {
    const email = 'test@example.com';
    const mockUser = { id: 1, email };
    User.findOne.mockResolvedValue(mockUser);

    const result = await repository.findByEmail(email);
    
    expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
    expect(result).toEqual(mockUser);
  });

  test('verifyEmail should call update with correct parameters', async () => {
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ id: 1, email_verified: true });
    const userId = 1;

    const result = await repository.verifyEmail(userId);
    
    expect(repository.update).toHaveBeenCalledWith(userId, { email_verified: true });
    expect(result).toEqual({ id: 1, email_verified: true });
  });

  test('updatePassword should call update with correct parameters', async () => {
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ id: 1, password_hash: 'new-hash' });
    const userId = 1;
    const passwordHash = 'new-hash';

    const result = await repository.updatePassword(userId, passwordHash);
    
    expect(repository.update).toHaveBeenCalledWith(userId, { password_hash: passwordHash });
    expect(result).toEqual({ id: 1, password_hash: 'new-hash' });
  });

  test('getWithRoles should call findByPk with correct parameters', async () => {
    const userId = 1;
    const mockUser = { 
      id: userId, 
      email: 'test@example.com',
      UserRole: { id: 1, role: 'admin' }
    };
    User.findByPk.mockResolvedValue(mockUser);

    const result = await repository.getWithRoles(userId);
    
    expect(User.findByPk).toHaveBeenCalledWith(userId, {
      include: ['UserRole']
    });
    expect(result).toEqual(mockUser);
  });
}); 
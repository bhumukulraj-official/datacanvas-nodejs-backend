const userService = require('../../../../src/services/auth/user.service');
const UserRepository = require('../../../../src/data/repositories/auth/UserRepository');
const passwordUtil = require('../../../../src/utils/password.util');
const { DuplicateResourceError, CustomError } = require('../../../../src/utils/error.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/auth/UserRepository');

// Mock the password utility
jest.mock('../../../../src/utils/password.util', () => ({
  hashPassword: jest.fn()
}));

describe('UserService', () => {
  let mockUserRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockUserRepository = new UserRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    userService.userRepository = mockUserRepository;
    
    // Mock the sanitize user function
    userService._sanitizeUser = jest.fn(user => {
      const { password_hash, ...userData } = user.get({ plain: true });
      return userData;
    });
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User'
      };
      
      const hashedPassword = 'hashed_password_123';
      
      // Mock findByEmail to return null (email not taken)
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);
      
      // Mock password hashing
      passwordUtil.hashPassword.mockResolvedValue(hashedPassword);
      
      // Mock user creation
      const mockUser = {
        id: 1,
        email: userData.email,
        name: userData.name,
        password_hash: hashedPassword,
        created_at: new Date()
      };
      
      mockUserRepository.create = jest.fn().mockResolvedValue(mockUser);
      
      // Call the service method
      const result = await userService.registerUser(userData);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password_hash: hashedPassword
      });
      expect(result).toEqual(mockUser);
    });
    
    test('should throw error if email is already registered', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };
      
      // Mock findByEmail to return an existing user
      const existingUser = {
        id: 1,
        email: userData.email,
        name: 'Existing User'
      };
      
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(existingUser);
      
      // Call the service method and expect it to throw
      await expect(
        userService.registerUser(userData)
      ).rejects.toThrow(DuplicateResourceError);
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      const userId = 1;
      
      // Mock user with roles
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        password_hash: 'hashed_password',
        roles: [{ name: 'USER' }],
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'user@example.com',
          name: 'Test User',
          password_hash: 'hashed_password',
          roles: [{ name: 'USER' }]
        })
      };
      
      mockUserRepository.getWithRoles = jest.fn().mockResolvedValue(mockUser);
      
      // Call the service method
      const result = await userService.getProfile(userId);
      
      // Assertions
      expect(mockUserRepository.getWithRoles).toHaveBeenCalledWith(userId);
      expect(userService._sanitizeUser).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password_hash');
    });
    
    test('should throw error if user not found', async () => {
      const userId = 999;
      
      // Mock repository to return null (user not found)
      mockUserRepository.getWithRoles = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        userService.getProfile(userId)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockUserRepository.getWithRoles).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateProfile', () => {
    test('should update user profile successfully', async () => {
      const userId = 1;
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };
      
      // Mock update
      mockUserRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock updated user
      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Updated Name',
        bio: 'Updated bio',
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'user@example.com',
          name: 'Updated Name',
          bio: 'Updated bio'
        })
      };
      
      // Mock getProfile to return the updated user
      const getProfileSpy = jest.spyOn(userService, 'getProfile')
        .mockResolvedValue(mockUpdatedUser);
      
      // Call the service method
      const result = await userService.updateProfile(userId, updateData);
      
      // Assertions
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(getProfileSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUpdatedUser);
      
      // Restore the spy
      getProfileSpy.mockRestore();
    });
    
    test('should hash password if included in update data', async () => {
      const userId = 1;
      const updateData = {
        name: 'Updated Name',
        password: 'new_password123'
      };
      
      const hashedPassword = 'new_hashed_password';
      
      // Mock password hashing
      passwordUtil.hashPassword.mockResolvedValue(hashedPassword);
      
      // Mock update
      mockUserRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock getProfile
      const getProfileSpy = jest.spyOn(userService, 'getProfile')
        .mockResolvedValue({
          id: userId,
          email: 'user@example.com',
          name: 'Updated Name'
        });
      
      // Call the service method
      await userService.updateProfile(userId, updateData);
      
      // Assertions
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('new_password123');
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
        password_hash: hashedPassword
      });
      expect(getProfileSpy).toHaveBeenCalledWith(userId);
      
      // Restore the spy
      getProfileSpy.mockRestore();
    });
    
    test('should throw error if user not found', async () => {
      const userId = 999;
      const updateData = {
        name: 'Updated Name'
      };
      
      // Mock update to return 0 affected rows (user not found)
      mockUserRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        userService.updateProfile(userId, updateData)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    });
  });
}); 
const UserController = require('../../../../src/api/controllers/auth/user.controller');
const { UserService } = require('../../../../src/services/auth');

// Mock the UserService
jest.mock('../../../../src/services/auth', () => ({
  UserService: {
    registerUser: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  }
}));

describe('UserController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: '1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    it('should register a user successfully', async () => {
      req.body = mockUserData;
      UserService.registerUser.mockResolvedValue(mockUser);
      
      await UserController.register(req, res, next);
      
      expect(UserService.registerUser).toHaveBeenCalledWith(mockUserData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors during registration', async () => {
      req.body = mockUserData;
      const mockError = new Error('Registration failed');
      UserService.registerUser.mockRejectedValue(mockError);
      
      await UserController.register(req, res, next);
      
      expect(UserService.registerUser).toHaveBeenCalledWith(mockUserData);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      profile: {
        bio: 'Software developer',
        avatar: 'avatar.jpg'
      }
    };

    it('should get user profile successfully', async () => {
      UserService.getProfile.mockResolvedValue(mockProfile);
      
      await UserController.getProfile(req, res, next);
      
      expect(UserService.getProfile).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when getting profile', async () => {
      const mockError = new Error('Profile retrieval failed');
      UserService.getProfile.mockRejectedValue(mockError);
      
      await UserController.getProfile(req, res, next);
      
      expect(UserService.getProfile).toHaveBeenCalledWith('1');
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateProfile', () => {
    const mockUpdateData = {
      name: 'Updated Name',
      bio: 'Updated bio'
    };
    
    const mockUpdatedProfile = {
      id: '1',
      email: 'test@example.com',
      name: 'Updated Name',
      profile: {
        bio: 'Updated bio',
        avatar: 'avatar.jpg'
      }
    };

    it('should update user profile successfully', async () => {
      req.body = mockUpdateData;
      UserService.updateProfile.mockResolvedValue(mockUpdatedProfile);
      
      await UserController.updateProfile(req, res, next);
      
      expect(UserService.updateProfile).toHaveBeenCalledWith('1', mockUpdateData);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedProfile
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors during profile update', async () => {
      req.body = mockUpdateData;
      const mockError = new Error('Profile update failed');
      UserService.updateProfile.mockRejectedValue(mockError);
      
      await UserController.updateProfile(req, res, next);
      
      expect(UserService.updateProfile).toHaveBeenCalledWith('1', mockUpdateData);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
}); 
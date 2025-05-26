const profileController = require('../../../../src/api/controllers/content/profile.controller');
const { ProfileService } = require('../../../../src/services/content');

// Mock the ProfileService
jest.mock('../../../../src/services/content/profile.service', () => ({
  getProfile: jest.fn(),
  updateSocialLinks: jest.fn()
}));

describe('ProfileController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      params: {
        userId: 'user-123'
      },
      body: {
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
        twitter: 'https://twitter.com/johndoe'
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    test('should get profile successfully', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        bio: 'Software Engineer',
        social_links: {
          github: 'https://github.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        }
      };
      
      // Mock the getProfile service method
      ProfileService.getProfile.mockResolvedValue(mockProfile);
      
      await profileController.getProfile(mockReq, mockRes, mockNext);
      
      expect(ProfileService.getProfile).toHaveBeenCalledWith(
        mockReq.params.userId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get profile');
      
      // Mock the getProfile service method to throw an error
      ProfileService.getProfile.mockRejectedValue(mockError);
      
      await profileController.getProfile(mockReq, mockRes, mockNext);
      
      expect(ProfileService.getProfile).toHaveBeenCalledWith(
        mockReq.params.userId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateSocialLinks', () => {
    test('should update social links successfully', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        bio: 'Software Engineer',
        social_links: {
          github: 'https://github.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        }
      };
      
      // Mock the updateSocialLinks service method
      ProfileService.updateSocialLinks.mockResolvedValue(mockProfile);
      
      await profileController.updateSocialLinks(mockReq, mockRes, mockNext);
      
      expect(ProfileService.updateSocialLinks).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update social links');
      
      // Mock the updateSocialLinks service method to throw an error
      ProfileService.updateSocialLinks.mockRejectedValue(mockError);
      
      await profileController.updateSocialLinks(mockReq, mockRes, mockNext);
      
      expect(ProfileService.updateSocialLinks).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 
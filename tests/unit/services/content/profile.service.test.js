const profileService = require('../../../../src/services/content/profile.service');
const { ProfileRepository } = require('../../../../src/data/repositories/content');
const { CustomError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/content', () => ({
  ProfileRepository: jest.fn()
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('ProfileService', () => {
  let mockProfileRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockProfileRepository = new ProfileRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Initialize mock methods
    mockProfileRepository.updateSocialLinks = jest.fn();
    
    // Mock repository on the service
    profileService.profileRepo = mockProfileRepository;
  });

  describe('getProfile', () => {
    test('should return profile for a user', async () => {
      // Mock profile
      const mockProfile = {
        id: 1,
        user_id: 123,
        bio: 'Test bio',
        social_links: {
          github: 'https://github.com/testuser',
          linkedin: 'https://linkedin.com/in/testuser'
        },
        created_at: new Date()
      };
      
      mockProfileRepository.getByUserId = jest.fn().mockResolvedValue(mockProfile);
      
      // Call the service method
      const result = await profileService.getProfile(123);
      
      // Assertions
      expect(mockProfileRepository.getByUserId).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockProfile);
    });
    
    test('should throw error if profile not found', async () => {
      mockProfileRepository.getByUserId = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        profileService.getProfile(999)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProfileRepository.getByUserId).toHaveBeenCalledWith(999);
    });
  });

  describe('updateSocialLinks', () => {
    test('should update social links successfully', async () => {
      // Mock social links
      const socialLinks = {
        github: 'https://github.com/updateduser',
        linkedin: 'https://linkedin.com/in/updateduser'
      };
      
      // Mock the update method
      mockProfileRepository.updateSocialLinks = jest.fn().mockResolvedValue([1]);
      
      // Mock the getProfile method
      const mockUpdatedProfile = {
        id: 1,
        user_id: 123,
        bio: 'Test bio',
        social_links: socialLinks,
        created_at: new Date()
      };
      
      const getProfileSpy = jest.spyOn(profileService, 'getProfile')
        .mockResolvedValue(mockUpdatedProfile);
      
      // Call the service method
      const result = await profileService.updateSocialLinks(123, socialLinks);
      
      // Assertions
      expect(mockProfileRepository.updateSocialLinks).toHaveBeenCalledWith(123, socialLinks);
      expect(getProfileSpy).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockUpdatedProfile);
      
      // Restore the spy
      getProfileSpy.mockRestore();
    });
    
    test('should throw error for invalid platform in social links', async () => {
      // Mock invalid social links
      const invalidSocialLinks = {
        github: 'https://github.com/testuser',
        facebook: 'https://facebook.com/testuser' // Not in valid platforms
      };
      
      // Call the service method and expect it to throw
      await expect(
        profileService.updateSocialLinks(123, invalidSocialLinks)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProfileRepository.updateSocialLinks).not.toHaveBeenCalled();
    });
    
    test('should throw error if profile not found', async () => {
      // Mock social links
      const socialLinks = {
        github: 'https://github.com/testuser'
      };
      
      // Mock update to return 0 affected rows (profile not found)
      mockProfileRepository.updateSocialLinks = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        profileService.updateSocialLinks(999, socialLinks)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProfileRepository.updateSocialLinks).toHaveBeenCalledWith(999, socialLinks);
    });
  });

  describe('updateBio', () => {
    test('should update bio successfully', async () => {
      // Mock bio
      const bio = 'Updated bio';
      
      // Mock the update method
      mockProfileRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock the getProfile method
      const mockUpdatedProfile = {
        id: 1,
        user_id: 123,
        bio: 'Updated bio',
        social_links: {},
        created_at: new Date()
      };
      
      const getProfileSpy = jest.spyOn(profileService, 'getProfile')
        .mockResolvedValue(mockUpdatedProfile);
      
      // Call the service method
      const result = await profileService.updateBio(123, bio);
      
      // Assertions
      expect(mockProfileRepository.update).toHaveBeenCalledWith(
        { user_id: 123 },
        { bio }
      );
      expect(getProfileSpy).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockUpdatedProfile);
      
      // Restore the spy
      getProfileSpy.mockRestore();
    });
    
    test('should throw error if profile not found', async () => {
      // Mock update to return 0 affected rows (profile not found)
      mockProfileRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        profileService.updateBio(999, 'New bio')
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProfileRepository.update).toHaveBeenCalledWith(
        { user_id: 999 },
        { bio: 'New bio' }
      );
    });
  });
}); 
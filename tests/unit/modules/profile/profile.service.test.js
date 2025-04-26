const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

// Mock dependencies
jest.mock('fs/promises');
jest.mock('path');
jest.mock('sharp');
jest.mock('src/modules/profile/models/Profile');
jest.mock('src/modules/profile/models/Skill');
jest.mock('src/shared/utils/logger');

// Import the mocks for use in tests
const Profile = require('src/modules/profile/models/Profile');
const Skill = require('src/modules/profile/models/Skill');
const logger = require('src/shared/utils/logger');

// Import the service to test
const ProfileService = require('src/modules/profile/services/profile.service');

describe('ProfileService', () => {
  let profileService;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the service
    profileService = new ProfileService();
  });
  
  describe('getProfile', () => {
    it('should return null if no profile is found', async () => {
      // Setup
      Profile.findOne.mockResolvedValue(null);
      
      // Execute
      const result = await profileService.getProfile(1);
      
      // Assert
      expect(result).toBeNull();
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: expect.any(Array)
      });
    });
    
    it('should return profile with related data when found', async () => {
      // Setup
      const mockProfile = {
        id: 1,
        user_id: 1,
        bio: 'Test bio',
        avatar_url: 'http://example.com/avatar.jpg',
        title: 'Software Developer',
        location: 'New York',
        website: 'https://example.com',
        social_links: {
          github: 'https://github.com/username',
          linkedin: 'https://linkedin.com/in/username'
        }
      };
      
      Profile.findOne.mockResolvedValue(mockProfile);
      
      // Execute
      const result = await profileService.getProfile(1);
      
      // Assert
      expect(result).toEqual(mockProfile);
    });
    
    it('should return profile with username parameter', async () => {
      // Setup
      const mockProfile = {
        id: 1,
        user_id: 1,
        bio: 'Test bio',
        avatar_url: 'http://example.com/avatar.jpg',
        title: 'Software Developer',
        username: 'testuser'
      };
      
      Profile.findOne.mockResolvedValue(mockProfile);
      
      // Execute
      const result = await profileService.getProfileByUsername('testuser');
      
      // Assert
      expect(result).toEqual(mockProfile);
      expect(Profile.findOne).toHaveBeenCalledWith({
        include: expect.any(Array),
        where: { '$User.username$': 'testuser' }
      });
    });
  });
  
  describe('updateProfile', () => {
    const mockProfileData = {
      bio: 'Updated bio',
      title: 'Senior Developer',
      location: 'San Francisco',
      website: 'https://updated-example.com',
      social_links: {
        github: 'https://github.com/updated',
        twitter: 'https://twitter.com/updated'
      }
    };
    
    it('should throw an error if profile not found', async () => {
      // Setup
      Profile.findOne.mockResolvedValue(null);
      
      // Execute and Assert
      await expect(profileService.updateProfile(1, mockProfileData))
        .rejects.toThrow('Profile not found');
    });
    
    it('should update an existing profile', async () => {
      // Setup
      const mockExistingProfile = {
        id: 1,
        user_id: 1,
        bio: 'Test bio',
        title: 'Software Developer',
        location: 'New York',
        website: 'https://example.com',
        social_links: {
          github: 'https://github.com/username'
        },
        update: jest.fn().mockResolvedValue({
          id: 1,
          user_id: 1,
          ...mockProfileData
        })
      };
      
      Profile.findOne.mockResolvedValue(mockExistingProfile);
      
      // Execute
      const result = await profileService.updateProfile(1, mockProfileData);
      
      // Assert
      expect(mockExistingProfile.update).toHaveBeenCalledWith(mockProfileData);
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        user_id: 1,
        bio: mockProfileData.bio,
        title: mockProfileData.title,
        location: mockProfileData.location,
        website: mockProfileData.website,
        social_links: mockProfileData.social_links
      }));
    });
  });
  
  describe('updateAvatar', () => {
    const mockUserId = 1;
    const mockFile = {
      path: '/tmp/upload/temp-image.jpg',
      originalname: 'profile.jpg',
      mimetype: 'image/jpeg'
    };
    
    it('should throw an error if profile not found', async () => {
      // Setup
      Profile.findOne.mockResolvedValue(null);
      
      // Execute and Assert
      await expect(profileService.updateAvatar(mockUserId, mockFile))
        .rejects.toThrow('Profile not found');
    });
    
    it('should process and update avatar successfully', async () => {
      // Setup
      const mockExistingProfile = {
        id: 1,
        user_id: mockUserId,
        avatar_url: null,
        update: jest.fn().mockResolvedValue({
          id: 1,
          user_id: mockUserId,
          avatar_url: '/uploads/avatars/1-profile.jpg'
        })
      };
      
      // Mock directory exists check - directory exists
      fs.access.mockResolvedValue(undefined);
      
      // Mock sharp image processing
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({})
      };
      sharp.mockReturnValue(mockSharpInstance);
      
      // Mock path functions
      path.join.mockReturnValue('/uploads/avatars/1-profile.jpg');
      path.basename.mockReturnValue('profile.jpg');
      
      Profile.findOne.mockResolvedValue(mockExistingProfile);
      
      // Execute
      const result = await profileService.updateAvatar(mockUserId, mockFile);
      
      // Assert
      expect(sharp).toHaveBeenCalledWith(mockFile.path);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(200, 200);
      expect(mockExistingProfile.update).toHaveBeenCalledWith({
        avatar_url: '/uploads/avatars/1-profile.jpg'
      });
      expect(result).toEqual(expect.objectContaining({
        avatar_url: '/uploads/avatars/1-profile.jpg'
      }));
    });
    
    it('should create the avatars directory if it does not exist', async () => {
      // Setup
      const mockExistingProfile = {
        id: 1,
        user_id: mockUserId,
        avatar_url: null,
        update: jest.fn().mockResolvedValue({
          id: 1,
          user_id: mockUserId,
          avatar_url: '/uploads/avatars/1-profile.jpg'
        })
      };
      
      // Mock directory does not exist
      fs.access.mockRejectedValue(new Error('ENOENT'));
      fs.mkdir.mockResolvedValue(undefined);
      
      // Mock sharp image processing
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({})
      };
      sharp.mockReturnValue(mockSharpInstance);
      
      // Mock path functions
      path.join.mockReturnValue('/uploads/avatars/1-profile.jpg');
      path.basename.mockReturnValue('profile.jpg');
      path.dirname.mockReturnValue('/uploads/avatars');
      
      Profile.findOne.mockResolvedValue(mockExistingProfile);
      
      // Execute
      const result = await profileService.updateAvatar(mockUserId, mockFile);
      
      // Assert
      expect(fs.mkdir).toHaveBeenCalledWith('/uploads/avatars', { recursive: true });
      expect(mockExistingProfile.update).toHaveBeenCalledWith({
        avatar_url: '/uploads/avatars/1-profile.jpg'
      });
    });
    
    it('should delete the old avatar if it exists', async () => {
      // Setup
      const mockExistingProfile = {
        id: 1,
        user_id: mockUserId,
        avatar_url: '/uploads/avatars/old-avatar.jpg',
        update: jest.fn().mockResolvedValue({
          id: 1,
          user_id: mockUserId,
          avatar_url: '/uploads/avatars/1-profile.jpg'
        })
      };
      
      // Mock directory exists check
      fs.access.mockResolvedValue(undefined);
      
      // Mock file deletion
      fs.unlink.mockResolvedValue(undefined);
      
      // Mock sharp image processing
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue({})
      };
      sharp.mockReturnValue(mockSharpInstance);
      
      // Mock path functions
      path.join.mockReturnValue('/uploads/avatars/1-profile.jpg');
      path.basename.mockReturnValue('profile.jpg');
      
      Profile.findOne.mockResolvedValue(mockExistingProfile);
      
      // Execute
      const result = await profileService.updateAvatar(mockUserId, mockFile);
      
      // Assert
      expect(fs.unlink).toHaveBeenCalledWith('/uploads/avatars/old-avatar.jpg');
      expect(mockExistingProfile.update).toHaveBeenCalledWith({
        avatar_url: '/uploads/avatars/1-profile.jpg'
      });
    });
  });
  
  // Additional tests could be added for other methods like:
  // - createProfile
  // - removeAvatar
  // - etc.
}); 
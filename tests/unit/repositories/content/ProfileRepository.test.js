const { ProfileRepository } = require('../../../../src/data/repositories/content');
const { Profile } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  Profile: {
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
    
    async update(id, data) {
      return { id, ...data };
    }
  };
});

describe('ProfileRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProfileRepository();
    jest.clearAllMocks();
  });

  test('getByUserId should call findOne with correct parameters', async () => {
    const userId = 5;
    const mockProfile = { id: 1, user_id: userId };
    Profile.findOne.mockResolvedValue(mockProfile);
    
    const result = await repository.getByUserId(userId);
    
    expect(Profile.findOne).toHaveBeenCalledWith({ where: { user_id: userId } });
    expect(result).toEqual(mockProfile);
  });

  test('updateSocialLinks should call update with correct parameters', async () => {
    const userId = 5;
    const socialLinks = [
      { platform: 'twitter', url: 'https://twitter.com/user' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/user' }
    ];
    const updateResult = [1]; // Number of rows affected
    Profile.update.mockResolvedValue(updateResult);
    
    const result = await repository.updateSocialLinks(userId, socialLinks);
    
    expect(Profile.update).toHaveBeenCalledWith(
      { social_links: socialLinks },
      { where: { user_id: userId } }
    );
    expect(result).toEqual(updateResult);
  });

  test('updateSocialLink should get profile, update links and call update method', async () => {
    const userId = 5;
    const platform = 'twitter';
    const url = 'https://twitter.com/newuser';
    
    // Existing profile with links
    const existingProfile = {
      id: 1,
      user_id: userId,
      social_links: [
        { platform: 'twitter', url: 'https://twitter.com/olduser' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/user' }
      ]
    };
    
    // Expected updated links
    const expectedLinks = [
      { platform: 'linkedin', url: 'https://linkedin.com/in/user' },
      { platform, url }
    ];
    
    // Mock getByUserId to return existing profile
    repository.getByUserId = jest.fn().mockResolvedValue(existingProfile);
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: existingProfile.id,
      social_links: expectedLinks
    });
    
    const result = await repository.updateSocialLink(userId, platform, url);
    
    expect(repository.getByUserId).toHaveBeenCalledWith(userId);
    expect(repository.update).toHaveBeenCalledWith(existingProfile.id, { social_links: expectedLinks });
    expect(result).toEqual({ 
      id: existingProfile.id,
      social_links: expectedLinks
    });
  });
}); 
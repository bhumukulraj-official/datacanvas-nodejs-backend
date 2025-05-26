const contentServices = require('../../../../src/services/content');

describe('Content Services Index', () => {
  test('should export all content services', () => {
    expect(contentServices).toHaveProperty('ProjectService');
    expect(contentServices).toHaveProperty('ProfileService');
    expect(contentServices).toHaveProperty('FileService');
    expect(contentServices).toHaveProperty('TagService');
    expect(contentServices).toHaveProperty('SkillService');
    expect(contentServices).toHaveProperty('SearchService');
    expect(contentServices).toHaveProperty('ContactService');
  });

  test('should export services as objects', () => {
    expect(typeof contentServices.ProjectService).toBe('object');
    expect(typeof contentServices.ProfileService).toBe('object');
    expect(typeof contentServices.FileService).toBe('object');
    expect(typeof contentServices.TagService).toBe('object');
    expect(typeof contentServices.SkillService).toBe('object');
    expect(typeof contentServices.SearchService).toBe('object');
    expect(typeof contentServices.ContactService).toBe('object');
  });
}); 
const PublicApiViewRepository = require('../../../../src/data/repositories/public_api/PublicApiViewRepository');
const PublicApiView = require('../../../../src/data/models/public_api/PublicApiView');

// Mock the model
jest.mock('../../../../src/data/models/public_api/PublicApiView', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn()
}));

describe('PublicApiViewRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByName should call findOne with correct parameters', async () => {
    const name = 'users_view';
    const mockView = { id: 1, name, schema_name: 'public_api' };
    
    PublicApiView.findOne.mockResolvedValue(mockView);
    
    const result = await PublicApiViewRepository.findByName(name);
    
    expect(PublicApiView.findOne).toHaveBeenCalledWith({
      where: { name }
    });
    expect(result).toEqual(mockView);
  });

  test('findActiveViews should call findAll with correct parameters', async () => {
    const mockViews = [
      { id: 1, name: 'users_view', is_active: true },
      { id: 2, name: 'projects_view', is_active: true }
    ];
    
    PublicApiView.findAll.mockResolvedValue(mockViews);
    
    const result = await PublicApiViewRepository.findActiveViews();
    
    expect(PublicApiView.findAll).toHaveBeenCalledWith({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    expect(result).toEqual(mockViews);
  });

  test('findBySchema should call findAll with correct parameters', async () => {
    const schemaName = 'public_api';
    const mockViews = [
      { id: 1, name: 'users_view', schema_name: schemaName },
      { id: 2, name: 'projects_view', schema_name: schemaName }
    ];
    
    PublicApiView.findAll.mockResolvedValue(mockViews);
    
    const result = await PublicApiViewRepository.findBySchema(schemaName);
    
    expect(PublicApiView.findAll).toHaveBeenCalledWith({
      where: { schema_name: schemaName },
      order: [['name', 'ASC']]
    });
    expect(result).toEqual(mockViews);
  });

  test('updateViewDefinition should call update with correct parameters', async () => {
    const name = 'users_view';
    const viewDefinition = 'SELECT id, username, email FROM users';
    const updateResult = [1]; // Number of affected rows
    
    PublicApiView.update.mockResolvedValue(updateResult);
    
    const result = await PublicApiViewRepository.updateViewDefinition(name, viewDefinition);
    
    expect(PublicApiView.update).toHaveBeenCalledWith(
      { view_definition: viewDefinition },
      { where: { name } }
    );
    expect(result).toEqual(updateResult);
  });

  test('toggleActive should call update with correct parameters', async () => {
    const name = 'users_view';
    const isActive = false;
    const updateResult = [1]; // Number of affected rows
    
    PublicApiView.update.mockResolvedValue(updateResult);
    
    const result = await PublicApiViewRepository.toggleActive(name, isActive);
    
    expect(PublicApiView.update).toHaveBeenCalledWith(
      { is_active: isActive },
      { where: { name } }
    );
    expect(result).toEqual(updateResult);
  });
}); 
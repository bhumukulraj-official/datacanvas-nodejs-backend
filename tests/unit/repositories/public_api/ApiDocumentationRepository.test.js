const ApiDocumentationRepository = require('../../../../src/data/repositories/public_api/ApiDocumentationRepository');
const ApiDocumentation = require('../../../../src/data/models/public_api/ApiDocumentation');

// Mock the model
jest.mock('../../../../src/data/models/public_api/ApiDocumentation', () => ({
  findOne: jest.fn(),
  findAll: jest.fn()
}));

describe('ApiDocumentationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByEndpoint should call findOne with correct parameters', async () => {
    const endpoint = '/api/v1/users';
    const mockDoc = { id: 1, endpoint, method: 'GET' };
    
    ApiDocumentation.findOne.mockResolvedValue(mockDoc);
    
    const result = await ApiDocumentationRepository.findByEndpoint(endpoint);
    
    expect(ApiDocumentation.findOne).toHaveBeenCalledWith({
      where: { endpoint }
    });
    expect(result).toEqual(mockDoc);
  });

  test('findByMethod should call findAll with correct parameters', async () => {
    const method = 'GET';
    const mockDocs = [
      { id: 1, endpoint: '/api/v1/users', method },
      { id: 2, endpoint: '/api/v1/posts', method }
    ];
    
    ApiDocumentation.findAll.mockResolvedValue(mockDocs);
    
    const result = await ApiDocumentationRepository.findByMethod(method);
    
    expect(ApiDocumentation.findAll).toHaveBeenCalledWith({
      where: { method },
      order: [['endpoint', 'ASC']]
    });
    expect(result).toEqual(mockDocs);
  });

  test('findByApiVersion should call findAll with correct parameters', async () => {
    const apiVersion = 'v1';
    const mockDocs = [
      { id: 1, endpoint: '/api/v1/users', api_version: apiVersion },
      { id: 2, endpoint: '/api/v1/posts', api_version: apiVersion }
    ];
    
    ApiDocumentation.findAll.mockResolvedValue(mockDocs);
    
    const result = await ApiDocumentationRepository.findByApiVersion(apiVersion);
    
    expect(ApiDocumentation.findAll).toHaveBeenCalledWith({
      where: { api_version: apiVersion },
      order: [['endpoint', 'ASC']]
    });
    expect(result).toEqual(mockDocs);
  });
}); 
const MessageApiEndpointRepository = require('../../../../src/data/repositories/public_api/MessageApiEndpointRepository');
const MessageApiEndpoint = require('../../../../src/data/models/public_api/MessageApiEndpoint');

// Mock the model
jest.mock('../../../../src/data/models/public_api/MessageApiEndpoint', () => ({
  findOne: jest.fn(),
  findAll: jest.fn()
}));

describe('MessageApiEndpointRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByEndpoint should call findOne with correct parameters', async () => {
    const endpoint = '/api/v1/messages';
    const mockEndpoint = { id: 1, endpoint, method: 'GET' };
    
    MessageApiEndpoint.findOne.mockResolvedValue(mockEndpoint);
    
    const result = await MessageApiEndpointRepository.findByEndpoint(endpoint);
    
    expect(MessageApiEndpoint.findOne).toHaveBeenCalledWith({
      where: { endpoint }
    });
    expect(result).toEqual(mockEndpoint);
  });

  test('findByMethod should call findAll with correct parameters', async () => {
    const method = 'GET';
    const mockEndpoints = [
      { id: 1, endpoint: '/api/v1/messages', method },
      { id: 2, endpoint: '/api/v1/conversations', method }
    ];
    
    MessageApiEndpoint.findAll.mockResolvedValue(mockEndpoints);
    
    const result = await MessageApiEndpointRepository.findByMethod(method);
    
    expect(MessageApiEndpoint.findAll).toHaveBeenCalledWith({
      where: { method },
      order: [['endpoint', 'ASC']]
    });
    expect(result).toEqual(mockEndpoints);
  });

  test('findByTable should call findAll with correct parameters', async () => {
    const schemaName = 'messaging';
    const tableName = 'messages';
    const mockEndpoints = [
      { id: 1, schema_name: schemaName, table_name: tableName, endpoint: '/api/v1/messages' },
      { id: 2, schema_name: schemaName, table_name: tableName, endpoint: '/api/v1/messages/recent' }
    ];
    
    MessageApiEndpoint.findAll.mockResolvedValue(mockEndpoints);
    
    const result = await MessageApiEndpointRepository.findByTable(schemaName, tableName);
    
    expect(MessageApiEndpoint.findAll).toHaveBeenCalledWith({
      where: { 
        schema_name: schemaName,
        table_name: tableName
      },
      order: [['endpoint', 'ASC']]
    });
    expect(result).toEqual(mockEndpoints);
  });
}); 
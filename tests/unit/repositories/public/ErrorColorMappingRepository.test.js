const ErrorColorMappingRepository = require('../../../../src/data/repositories/public/ErrorColorMappingRepository');
const ErrorColorMapping = require('../../../../src/data/models/public/ErrorColorMapping');

// Mock the model
jest.mock('../../../../src/data/models/public/ErrorColorMapping', () => ({
  findOne: jest.fn(),
  findAll: jest.fn()
}));

describe('ErrorColorMappingRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByCategory should call findOne with correct parameters', async () => {
    const errorCategory = 'validation';
    const mockMapping = { 
      id: 1, 
      error_category: errorCategory,
      ui_color: 'red',
      hex_code: '#ff0000'
    };
    
    ErrorColorMapping.findOne.mockResolvedValue(mockMapping);
    
    const result = await ErrorColorMappingRepository.findByCategory(errorCategory);
    
    expect(ErrorColorMapping.findOne).toHaveBeenCalledWith({
      where: { error_category: errorCategory }
    });
    expect(result).toEqual(mockMapping);
  });

  test('getAllCategories should call findAll with correct parameters', async () => {
    const mockCategories = [
      { error_category: 'validation', ui_color: 'red', hex_code: '#ff0000', usage_description: 'For validation errors' },
      { error_category: 'server', ui_color: 'orange', hex_code: '#ffa500', usage_description: 'For server errors' }
    ];
    
    ErrorColorMapping.findAll.mockResolvedValue(mockCategories);
    
    const result = await ErrorColorMappingRepository.getAllCategories();
    
    expect(ErrorColorMapping.findAll).toHaveBeenCalledWith({
      attributes: ['error_category', 'ui_color', 'hex_code', 'usage_description'],
      order: [['error_category', 'ASC']]
    });
    expect(result).toEqual(mockCategories);
  });
}); 
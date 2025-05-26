const { InvoiceTemplateRepository } = require('../../../../src/data/repositories/billing');
const { InvoiceTemplate } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  InvoiceTemplate: {
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
      // Mock implementation
      return { id, ...data };
    }
  };
});

describe('InvoiceTemplateRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new InvoiceTemplateRepository();
    jest.clearAllMocks();
  });

  test('getDefaultTemplate should call findOne with correct parameters', async () => {
    const mockTemplate = { id: 1, name: 'Default Template', is_default: true };
    InvoiceTemplate.findOne.mockResolvedValue(mockTemplate);
    
    const result = await repository.getDefaultTemplate();
    
    expect(InvoiceTemplate.findOne).toHaveBeenCalledWith({ where: { is_default: true } });
    expect(result).toEqual(mockTemplate);
  });

  test('findByName should call findOne with correct parameters', async () => {
    const name = 'Custom Template';
    const mockTemplate = { id: 2, name, is_default: false };
    InvoiceTemplate.findOne.mockResolvedValue(mockTemplate);
    
    const result = await repository.findByName(name);
    
    expect(InvoiceTemplate.findOne).toHaveBeenCalledWith({ where: { name } });
    expect(result).toEqual(mockTemplate);
  });

  test('setAsDefault should update all templates and set the specified one as default', async () => {
    const templateId = 2;
    InvoiceTemplate.update.mockResolvedValue([1]); // Number of rows affected
    
    // Mock the update method from BaseRepository
    repository.update = jest.fn().mockResolvedValue({ id: templateId, is_default: true });
    
    const result = await repository.setAsDefault(templateId);
    
    // Should first unset all defaults
    expect(InvoiceTemplate.update).toHaveBeenCalledWith(
      { is_default: false },
      { where: { is_default: true } }
    );
    
    // Then set the new default
    expect(repository.update).toHaveBeenCalledWith(templateId, { is_default: true });
    
    expect(result).toEqual({ id: templateId, is_default: true });
  });
}); 
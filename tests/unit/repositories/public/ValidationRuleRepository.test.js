const ValidationRuleRepository = require('../../../../src/data/repositories/public/ValidationRuleRepository');
const ValidationRule = require('../../../../src/data/models/public/ValidationRule');

// Mock the model
jest.mock('../../../../src/data/models/public/ValidationRule', () => ({
  findAll: jest.fn(),
  findOne: jest.fn()
}));

describe('ValidationRuleRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByEntityType should call findAll with correct parameters', async () => {
    const entityType = 'user';
    const mockRules = [
      { id: 1, entity_type: entityType, field_name: 'email', rule_type: 'required' },
      { id: 2, entity_type: entityType, field_name: 'email', rule_type: 'email' }
    ];
    
    ValidationRule.findAll.mockResolvedValue(mockRules);
    
    const result = await ValidationRuleRepository.findByEntityType(entityType);
    
    expect(ValidationRule.findAll).toHaveBeenCalledWith({
      where: { entity_type: entityType },
      order: [['field_name', 'ASC'], ['rule_type', 'ASC']]
    });
    expect(result).toEqual(mockRules);
  });

  test('findByEntityTypeAndField should call findAll with correct parameters', async () => {
    const entityType = 'user';
    const fieldName = 'email';
    const mockRules = [
      { id: 1, entity_type: entityType, field_name: fieldName, rule_type: 'required' },
      { id: 2, entity_type: entityType, field_name: fieldName, rule_type: 'email' }
    ];
    
    ValidationRule.findAll.mockResolvedValue(mockRules);
    
    const result = await ValidationRuleRepository.findByEntityTypeAndField(entityType, fieldName);
    
    expect(ValidationRule.findAll).toHaveBeenCalledWith({
      where: { 
        entity_type: entityType,
        field_name: fieldName
      },
      order: [['rule_type', 'ASC']]
    });
    expect(result).toEqual(mockRules);
  });

  test('findByEntityTypeFieldAndRule should call findOne with correct parameters', async () => {
    const entityType = 'user';
    const fieldName = 'email';
    const ruleType = 'required';
    const mockRule = { 
      id: 1, 
      entity_type: entityType, 
      field_name: fieldName, 
      rule_type: ruleType 
    };
    
    ValidationRule.findOne.mockResolvedValue(mockRule);
    
    const result = await ValidationRuleRepository.findByEntityTypeFieldAndRule(entityType, fieldName, ruleType);
    
    expect(ValidationRule.findOne).toHaveBeenCalledWith({
      where: {
        entity_type: entityType,
        field_name: fieldName,
        rule_type: ruleType
      }
    });
    expect(result).toEqual(mockRule);
  });
}); 
const { EncryptionKeyAuditRepository } = require('../../../../src/data/repositories/billing');
const { EncryptionKeyAudit } = require('../../../../src/data/models');

// Mock the model
jest.mock('../../../../src/data/models', () => ({
  EncryptionKeyAudit: {
    findAll: jest.fn(),
    create: jest.fn()
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async create(data) {
      return EncryptionKeyAudit.create(data);
    }
  };
});

describe('EncryptionKeyAuditRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new EncryptionKeyAuditRepository();
    jest.clearAllMocks();
  });

  test('getByKeyVersion should call findAll with correct parameters', async () => {
    const keyVersion = 'v1';
    const mockAudits = [
      { id: 1, key_version: keyVersion, operation: 'create' },
      { id: 2, key_version: keyVersion, operation: 'rotate' }
    ];
    EncryptionKeyAudit.findAll.mockResolvedValue(mockAudits);
    
    const result = await repository.getByKeyVersion(keyVersion);
    
    expect(EncryptionKeyAudit.findAll).toHaveBeenCalledWith({
      where: { key_version: keyVersion },
      order: [['operation_timestamp', 'DESC']]
    });
    expect(result).toEqual(mockAudits);
  });

  test('logOperation should call create with correct parameters', async () => {
    const operation = 'rotate';
    const keyVersion = 'v1';
    const performedBy = 'admin';
    const ipAddress = '127.0.0.1';
    
    const mockCreatedAudit = { 
      id: 1, 
      operation, 
      key_version: keyVersion,
      performed_by: performedBy,
      ip_address: ipAddress,
      operation_timestamp: expect.any(Date)
    };
    
    EncryptionKeyAudit.create.mockResolvedValue(mockCreatedAudit);
    
    const result = await repository.logOperation(operation, keyVersion, performedBy, ipAddress);
    
    expect(EncryptionKeyAudit.create).toHaveBeenCalledWith({
      operation,
      key_version: keyVersion,
      performed_by: performedBy,
      ip_address: ipAddress,
      operation_timestamp: expect.any(Date)
    });
    expect(result).toEqual(mockCreatedAudit);
  });
}); 
const encryptionService = require('../../../../src/services/billing/encryption.service');
const { EncryptionKeyRepository, EncryptionKeyAuditRepository } = require('../../../../src/data/repositories/billing');
const { CustomError } = require('../../../../src/utils/error.util');
const crypto = require('crypto');

// Mock the repositories
jest.mock('../../../../src/data/repositories/billing', () => ({
  EncryptionKeyRepository: jest.fn(),
  EncryptionKeyAuditRepository: jest.fn()
}));

// Mock crypto
jest.mock('crypto', () => ({
  generateKeySync: jest.fn(),
  randomUUID: jest.fn()
}));

describe('EncryptionService', () => {
  let mockKeyRepository;
  let mockAuditRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockKeyRepository = new EncryptionKeyRepository();
    mockAuditRepository = new EncryptionKeyAuditRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Add mock methods
    mockKeyRepository.update = jest.fn();
    
    // Mock repositories on the service
    encryptionService.keyRepo = mockKeyRepository;
    encryptionService.auditRepo = mockAuditRepository;
  });

  describe('rotateEncryptionKey', () => {
    test('should rotate encryption key successfully', async () => {
      const performedBy = 'admin';
      const ipAddress = '127.0.0.1';
      const keyId = crypto.randomUUID();
      const keyData = 'base64_encoded_key_data';
      
      // Mock current active key
      const currentKey = {
        id: 1,
        key_identifier: 'old_key_id',
        key_data: 'old_key_data',
        version: 1,
        is_active: true
      };
      
      // Mock repository methods
      mockKeyRepository.getActiveKey = jest.fn().mockResolvedValue(currentKey);
      mockKeyRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock crypto functions
      const mockKey = {
        export: jest.fn().mockReturnValue(Buffer.from(keyData))
      };
      crypto.generateKeySync = jest.fn().mockReturnValue(mockKey);
      crypto.randomUUID = jest.fn().mockReturnValue(keyId);
      
      // Mock new key creation
      const mockNewKey = {
        id: 2,
        key_identifier: keyId,
        key_data: keyData,
        version: 2,
        is_active: true
      };
      
      mockKeyRepository.create = jest.fn().mockResolvedValue(mockNewKey);
      mockAuditRepository.logOperation = jest.fn().mockResolvedValue({
        id: 1,
        operation: 'rotate',
        key_version: 2,
        performed_by: performedBy,
        ip_address: ipAddress,
        created_at: new Date()
      });
      
      // Call the service method
      const result = await encryptionService.rotateEncryptionKey(performedBy, ipAddress);
      
      // Assertions
      expect(mockKeyRepository.getActiveKey).toHaveBeenCalled();
      expect(mockKeyRepository.update).toHaveBeenCalledWith(1, { is_active: false });
      expect(crypto.generateKeySync).toHaveBeenCalledWith('aes', { length: 256 });
      expect(crypto.randomUUID).toHaveBeenCalled();
      expect(mockKey.export).toHaveBeenCalled();
      
      expect(mockKeyRepository.create).toHaveBeenCalledWith({
        key_identifier: keyId,
        key_data: 'YmFzZTY0X2VuY29kZWRfa2V5X2RhdGE=',
        version: 2,
        is_active: true
      });
      
      expect(mockAuditRepository.logOperation).toHaveBeenCalledWith(
        'rotate',
        2,
        performedBy,
        ipAddress
      );
      
      expect(result).toEqual(mockNewKey);
    });
    
    test('should create first key if no active key exists', async () => {
      const performedBy = 'admin';
      const ipAddress = '127.0.0.1';
      const keyId = crypto.randomUUID();
      const keyData = 'base64_encoded_key_data';
      
      // Mock no current active key
      mockKeyRepository.getActiveKey = jest.fn().mockResolvedValue(null);
      
      // Mock crypto functions
      const mockKey = {
        export: jest.fn().mockReturnValue(Buffer.from(keyData))
      };
      crypto.generateKeySync = jest.fn().mockReturnValue(mockKey);
      crypto.randomUUID = jest.fn().mockReturnValue(keyId);
      
      // Mock new key creation
      const mockNewKey = {
        id: 1,
        key_identifier: keyId,
        key_data: keyData,
        version: 1,
        is_active: true
      };
      
      mockKeyRepository.create = jest.fn().mockResolvedValue(mockNewKey);
      mockAuditRepository.logOperation = jest.fn().mockResolvedValue({
        id: 1,
        operation: 'rotate',
        key_version: 1,
        performed_by: performedBy,
        ip_address: ipAddress,
        created_at: new Date()
      });
      
      // Call the service method
      const result = await encryptionService.rotateEncryptionKey(performedBy, ipAddress);
      
      // Assertions
      expect(mockKeyRepository.getActiveKey).toHaveBeenCalled();
      expect(mockKeyRepository.update).not.toHaveBeenCalled();
      expect(crypto.generateKeySync).toHaveBeenCalledWith('aes', { length: 256 });
      expect(crypto.randomUUID).toHaveBeenCalled();
      
      expect(mockKeyRepository.create).toHaveBeenCalledWith({
        key_identifier: keyId,
        key_data: 'YmFzZTY0X2VuY29kZWRfa2V5X2RhdGE=',
        version: 1,
        is_active: true
      });
      
      expect(mockAuditRepository.logOperation).toHaveBeenCalledWith(
        'rotate',
        1,
        performedBy,
        ipAddress
      );
      
      expect(result).toEqual(mockNewKey);
    });
  });

  describe('getCurrentKey', () => {
    test('should return the current active key', async () => {
      // Mock active key
      const mockActiveKey = {
        id: 1,
        key_identifier: 'key_id',
        key_data: 'key_data',
        version: 1,
        is_active: true
      };
      
      mockKeyRepository.getActiveKey = jest.fn().mockResolvedValue(mockActiveKey);
      
      // Call the service method
      const result = await encryptionService.getCurrentKey();
      
      // Assertions
      expect(mockKeyRepository.getActiveKey).toHaveBeenCalled();
      expect(result).toEqual(mockActiveKey);
    });
  });

  describe('getKeyHistory', () => {
    test('should return history for a specific key version', async () => {
      const version = 1;
      
      // Mock audit history
      const mockHistory = [
        {
          id: 1,
          operation: 'rotate',
          key_version: version,
          performed_by: 'admin',
          ip_address: '127.0.0.1',
          created_at: new Date()
        },
        {
          id: 2,
          operation: 'use',
          key_version: version,
          performed_by: 'system',
          ip_address: '127.0.0.1',
          created_at: new Date()
        }
      ];
      
      mockAuditRepository.getByKeyVersion = jest.fn().mockResolvedValue(mockHistory);
      
      // Call the service method
      const result = await encryptionService.getKeyHistory(version);
      
      // Assertions
      expect(mockAuditRepository.getByKeyVersion).toHaveBeenCalledWith(version);
      expect(result).toEqual(mockHistory);
    });
  });
}); 
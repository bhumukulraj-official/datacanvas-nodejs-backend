const clientInvitationService = require('../../../../src/services/auth/clientInvitation.service');
const ClientInvitationRepository = require('../../../../src/data/repositories/auth/ClientInvitationRepository');
const { CustomError } = require('../../../../src/utils/error.util');
const passwordUtil = require('../../../../src/utils/password.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/auth/ClientInvitationRepository');

// Mock the password utility
jest.mock('../../../../src/utils/password.util', () => ({
  generateRandomToken: jest.fn()
}));

describe('ClientInvitationService', () => {
  let mockInvitationRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockInvitationRepository = new ClientInvitationRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    clientInvitationService.invitationRepo = mockInvitationRepository;
  });

  describe('createInvitation', () => {
    test('should create a new invitation successfully', async () => {
      const senderId = 1;
      const email = 'client@example.com';
      const token = 'random_token_123';
      
      // Mock findByEmail to return no pending invitations
      mockInvitationRepository.findByEmail = jest.fn().mockResolvedValue([
        { id: 5, email, is_accepted: true } // Only accepted invitations
      ]);
      
      // Mock generateRandomToken
      passwordUtil.generateRandomToken.mockReturnValue(token);
      
      // Mock created invitation
      const mockInvitation = {
        id: 1,
        sender_id: senderId,
        email,
        invitation_token: token,
        expires_at: expect.any(Date),
        is_accepted: false,
        created_at: new Date()
      };
      
      mockInvitationRepository.create = jest.fn().mockResolvedValue(mockInvitation);
      
      // Call the service method
      const result = await clientInvitationService.createInvitation(senderId, email);
      
      // Assertions
      expect(mockInvitationRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(passwordUtil.generateRandomToken).toHaveBeenCalledWith(32);
      expect(mockInvitationRepository.create).toHaveBeenCalledWith({
        sender_id: senderId,
        email,
        invitation_token: token,
        expires_at: expect.any(Date)
      });
      expect(result).toEqual(mockInvitation);
    });
    
    test('should throw error if a pending invitation exists', async () => {
      const senderId = 1;
      const email = 'client@example.com';
      
      // Mock findByEmail to return a pending invitation
      mockInvitationRepository.findByEmail = jest.fn().mockResolvedValue([
        { id: 1, email, is_accepted: false }
      ]);
      
      // Call the service method and expect it to throw
      await expect(
        clientInvitationService.createInvitation(senderId, email)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockInvitationRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(passwordUtil.generateRandomToken).not.toHaveBeenCalled();
      expect(mockInvitationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    test('should accept an invitation successfully', async () => {
      const token = 'valid_token_123';
      const userId = 2;
      
      // Mock a valid invitation
      const mockInvitation = {
        id: 1,
        sender_id: 1,
        email: 'client@example.com',
        invitation_token: token,
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
        is_accepted: false
      };
      
      mockInvitationRepository.findValidInvitation = jest.fn().mockResolvedValue(mockInvitation);
      mockInvitationRepository.markAsAccepted = jest.fn().mockResolvedValue(true);
      
      // Call the service method
      const result = await clientInvitationService.acceptInvitation(token, userId);
      
      // Assertions
      expect(mockInvitationRepository.findValidInvitation).toHaveBeenCalledWith(token);
      expect(mockInvitationRepository.markAsAccepted).toHaveBeenCalledWith(mockInvitation.id, userId);
      expect(result).toEqual({ success: true });
    });
    
    test('should throw error for invalid or expired invitation', async () => {
      const token = 'invalid_token';
      const userId = 2;
      
      // Mock findValidInvitation to return null (invalid token)
      mockInvitationRepository.findValidInvitation = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        clientInvitationService.acceptInvitation(token, userId)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockInvitationRepository.findValidInvitation).toHaveBeenCalledWith(token);
      expect(mockInvitationRepository.markAsAccepted).not.toHaveBeenCalled();
    });
  });
}); 
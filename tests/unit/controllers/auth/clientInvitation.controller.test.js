const clientInvitationController = require('../../../../src/api/controllers/auth/clientInvitation.controller');
const { ClientInvitationService } = require('../../../../src/services/auth');

// Mock the ClientInvitationService
jest.mock('../../../../src/services/auth/clientInvitation.service', () => ({
  createInvitation: jest.fn(),
  acceptInvitation: jest.fn()
}));

describe('ClientInvitationController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      body: {
        email: 'client@example.com',
        token: 'invitation-token-123'
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    test('should create an invitation successfully', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        email: 'client@example.com',
        inviter_id: 'user-123',
        token: 'invitation-token-123'
      };
      
      // Mock the createInvitation service method
      ClientInvitationService.createInvitation.mockResolvedValue(mockInvitation);
      
      await clientInvitationController.createInvitation(mockReq, mockRes, mockNext);
      
      expect(ClientInvitationService.createInvitation).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.email
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvitation
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create invitation');
      
      // Mock the createInvitation service method to throw an error
      ClientInvitationService.createInvitation.mockRejectedValue(mockError);
      
      await clientInvitationController.createInvitation(mockReq, mockRes, mockNext);
      
      expect(ClientInvitationService.createInvitation).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body.email
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('acceptInvitation', () => {
    test('should accept an invitation successfully', async () => {
      // Mock the acceptInvitation service method
      ClientInvitationService.acceptInvitation.mockResolvedValue();
      
      await clientInvitationController.acceptInvitation(mockReq, mockRes, mockNext);
      
      expect(ClientInvitationService.acceptInvitation).toHaveBeenCalledWith(
        mockReq.body.token,
        mockReq.user.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to accept invitation');
      
      // Mock the acceptInvitation service method to throw an error
      ClientInvitationService.acceptInvitation.mockRejectedValue(mockError);
      
      await clientInvitationController.acceptInvitation(mockReq, mockRes, mockNext);
      
      expect(ClientInvitationService.acceptInvitation).toHaveBeenCalledWith(
        mockReq.body.token,
        mockReq.user.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 
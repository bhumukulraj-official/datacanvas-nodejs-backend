const { ContactController } = require('../../../../src/api/controllers/content');
const { ContactService } = require('../../../../src/services/content');
const logger = require('../../../../src/utils/logger.util');

// Mock dependencies
jest.mock('../../../../src/services/content', () => ({
  ContactService: {
    submitContactForm: jest.fn()
  }
}));

jest.mock('../../../../src/utils/logger.util', () => ({
  error: jest.fn()
}));

describe('ContactController', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        recaptchaToken: 'test-token'
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test Agent'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Mock _validateRecaptcha method
    jest.spyOn(ContactController, '_validateRecaptcha').mockResolvedValue(0.9);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('submitContactForm', () => {
    it('should submit contact form successfully', async () => {
      // Arrange
      const mockSubmission = {
        uuid: 'submission-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };
      ContactService.submitContactForm.mockResolvedValue(mockSubmission);
      
      // Act
      await ContactController.submitContactForm(req, res, next);
      
      // Assert
      expect(ContactService.submitContactForm).toHaveBeenCalledWith(
        req.body,
        '127.0.0.1',
        'Jest Test Agent',
        0.9
      );
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contact form submitted successfully',
        data: {
          id: 'submission-123',
          email: 'test@example.com',
          submitted_at: '2023-01-01T00:00:00Z'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle missing IP address', async () => {
      // Arrange
      const reqWithoutIp = {
        ...req,
        ip: undefined,
        connection: {
          remoteAddress: '192.168.1.1'
        }
      };
      
      const mockSubmission = {
        uuid: 'submission-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };
      ContactService.submitContactForm.mockResolvedValue(mockSubmission);
      
      // Act
      await ContactController.submitContactForm(reqWithoutIp, res, next);
      
      // Assert
      expect(ContactService.submitContactForm).toHaveBeenCalledWith(
        reqWithoutIp.body,
        '192.168.1.1',
        'Jest Test Agent',
        0.9
      );
      
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      ContactService.submitContactForm.mockRejectedValue(error);
      
      // Act
      await ContactController.submitContactForm(req, res, next);
      
      // Assert
      expect(ContactService.submitContactForm).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error in contact form submission', expect.any(Object));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
    
    it('should handle missing recaptchaToken', async () => {
      // Arrange
      const reqWithoutToken = {
        ...req,
        body: {
          ...req.body,
          recaptchaToken: undefined
        }
      };
      
      const mockSubmission = {
        uuid: 'submission-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };
      ContactService.submitContactForm.mockResolvedValue(mockSubmission);
      
      // Act
      await ContactController.submitContactForm(reqWithoutToken, res, next);
      
      // Assert
      expect(ContactService.submitContactForm).toHaveBeenCalledWith(
        reqWithoutToken.body,
        '127.0.0.1',
        'Jest Test Agent',
        null
      );
      
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
  
  describe('_validateRecaptcha', () => {
    it('should return null when not implemented', async () => {
      // Restore the original implementation
      jest.restoreAllMocks();
      
      // Act
      const result = await ContactController._validateRecaptcha('test-token');
      
      // Assert
      expect(result).toBeNull();
    });
  });
}); 
const webhookController = require('../../../../src/api/controllers/billing/webhook.controller');
const { WebhookService } = require('../../../../src/services/billing');

// Mock the WebhookService
jest.mock('../../../../src/services/billing/webhook.service', () => ({
  processIncomingWebhook: jest.fn(),
  retryFailedWebhooks: jest.fn()
}));

describe('WebhookController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      body: {
        event: 'invoice.paid',
        data: {
          id: 'invoice-123'
        }
      },
      headers: {
        'x-webhook-signature': 'webhook-signature-123',
        'content-type': 'application/json'
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

  describe('processWebhook', () => {
    test('should process webhook successfully', async () => {
      const mockResult = {
        processed: true,
        event: 'invoice.paid',
        invoiceId: 'invoice-123'
      };
      
      // Mock the processIncomingWebhook service method
      WebhookService.processIncomingWebhook.mockResolvedValue(mockResult);
      
      await webhookController.processWebhook(mockReq, mockRes, mockNext);
      
      expect(WebhookService.processIncomingWebhook).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.headers
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to process webhook');
      
      // Mock the processIncomingWebhook service method to throw an error
      WebhookService.processIncomingWebhook.mockRejectedValue(mockError);
      
      await webhookController.processWebhook(mockReq, mockRes, mockNext);
      
      expect(WebhookService.processIncomingWebhook).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.headers
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('retryWebhooks', () => {
    test('should retry failed webhooks successfully', async () => {
      const mockResults = {
        retried: 3,
        successful: 2,
        failed: 1
      };
      
      // Mock the retryFailedWebhooks service method
      WebhookService.retryFailedWebhooks.mockResolvedValue(mockResults);
      
      await webhookController.retryWebhooks(mockReq, mockRes, mockNext);
      
      expect(WebhookService.retryFailedWebhooks).toHaveBeenCalled();
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to retry webhooks');
      
      // Mock the retryFailedWebhooks service method to throw an error
      WebhookService.retryFailedWebhooks.mockRejectedValue(mockError);
      
      await webhookController.retryWebhooks(mockReq, mockRes, mockNext);
      
      expect(WebhookService.retryFailedWebhooks).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 
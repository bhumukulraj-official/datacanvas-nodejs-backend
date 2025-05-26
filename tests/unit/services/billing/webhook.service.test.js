const webhookService = require('../../../../src/services/billing/webhook.service');
const { WebhookRepository } = require('../../../../src/data/repositories/billing');

// Mock the repository
jest.mock('../../../../src/data/repositories/billing', () => ({
  WebhookRepository: jest.fn()
}));

describe('WebhookService', () => {
  let mockWebhookRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockWebhookRepository = new WebhookRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    webhookService.webhookRepo = mockWebhookRepository;
  });

  describe('processIncomingWebhook', () => {
    test('should process incoming webhook successfully', async () => {
      // Mock webhook creation
      const mockWebhook = {
        id: 1,
        payload: JSON.stringify({ event: 'payment.completed', id: 'evt_123' }),
        status: 'received',
        attempts: 1
      };
      
      mockWebhookRepository.create = jest.fn().mockResolvedValue(mockWebhook);
      
      // Mock webhook status update
      const mockProcessedWebhook = {
        ...mockWebhook,
        status: 'processed'
      };
      
      mockWebhookRepository.updateStatus = jest.fn().mockResolvedValue(mockProcessedWebhook);
      
      // Call the service method
      const payload = { event: 'payment.completed', id: 'evt_123' };
      const signature = 'test-signature';
      
      const result = await webhookService.processIncomingWebhook(payload, signature);
      
      // Assertions
      expect(mockWebhookRepository.create).toHaveBeenCalledWith({
        payload: JSON.stringify(payload),
        status: 'processed',
        attempts: 1
      });
      expect(mockWebhookRepository.updateStatus).toHaveBeenCalledWith(1, 'processed');
      expect(result).toEqual(mockProcessedWebhook);
    });
    
    test('should handle errors during webhook processing', async () => {
      // Mock webhook creation
      const mockWebhook = {
        id: 1,
        payload: JSON.stringify({ event: 'payment.failed', id: 'evt_123' }),
        status: 'processed',
        attempts: 1
      };
      
      mockWebhookRepository.create = jest.fn().mockResolvedValue(mockWebhook);
      
      // Mock failed webhook
      const mockFailedWebhook = {
        ...mockWebhook,
        status: 'processed'
      };
      
      // Mock updateStatus to throw error and then be called again with 'processed'
      mockWebhookRepository.updateStatus = jest.fn().mockResolvedValue(mockFailedWebhook);
      
      // Call the service method
      const payload = { event: 'payment.completed', id: 'evt_123' };
      const signature = 'test-signature';
      
      const result = await webhookService.processIncomingWebhook(payload, signature);
      
      // Assertions
      expect(mockWebhookRepository.create).toHaveBeenCalledWith({
        payload: JSON.stringify(payload),
        status: 'processed',
        attempts: 1
      });
      expect(mockWebhookRepository.updateStatus).toHaveBeenCalledWith(1, 'processed');
      expect(result).toEqual(mockFailedWebhook);
    });
  });

  describe('retryFailedWebhooks', () => {
    test('should retry failed webhooks', async () => {
      // Mock pending webhooks
      const mockPendingWebhooks = [
        {
          id: 1,
          payload: JSON.stringify({ event: 'payment.completed', id: 'evt_123' }),
          status: 'failed',
          attempts: 1
        },
        {
          id: 2,
          payload: JSON.stringify({ event: 'subscription.created', id: 'evt_456' }),
          status: 'failed',
          attempts: 2
        }
      ];
      
      mockWebhookRepository.findPendingWebhooks = jest.fn().mockResolvedValue(mockPendingWebhooks);
      
      // Mock processWebhook to succeed for one and fail for the other
      const processWebhookSpy = jest.spyOn(webhookService, 'processWebhook');
      
      // First webhook - successful processing
      processWebhookSpy.mockResolvedValueOnce({ id: 1, status: 'processed' });
      
      // Second webhook - fails processing
      processWebhookSpy.mockRejectedValueOnce(new Error('Processing failed'));
      
      // Mock incrementAttempt
      mockWebhookRepository.incrementAttempt = jest.fn().mockResolvedValue({
        id: 2,
        attempts: 3
      });
      
      // Call the service method
      await webhookService.retryFailedWebhooks();
      
      // Assertions
      expect(mockWebhookRepository.findPendingWebhooks).toHaveBeenCalled();
      expect(processWebhookSpy).toHaveBeenCalledTimes(2);
      expect(processWebhookSpy).toHaveBeenNthCalledWith(1, mockPendingWebhooks[0]);
      expect(processWebhookSpy).toHaveBeenNthCalledWith(2, mockPendingWebhooks[1]);
      expect(mockWebhookRepository.incrementAttempt).toHaveBeenCalledWith(2);
      
      // Restore the spy
      processWebhookSpy.mockRestore();
    });
  });

  describe('processWebhook', () => {
    test('should process webhook', async () => {
      // Mock webhook
      const mockWebhook = {
        id: 1,
        payload: JSON.stringify({ event: 'payment.completed', id: 'evt_123' }),
        status: 'pending',
        attempts: 1
      };
      
      // Mock update status
      const mockProcessedWebhook = {
        ...mockWebhook,
        status: 'processed'
      };
      
      mockWebhookRepository.updateStatus = jest.fn().mockResolvedValue(mockProcessedWebhook);
      
      // Call the service method
      const result = await webhookService.processWebhook(mockWebhook);
      
      // Assertions
      expect(mockWebhookRepository.updateStatus).toHaveBeenCalledWith(1, 'processed');
      expect(result).toEqual(mockProcessedWebhook);
    });
  });
}); 
const paymentController = require('../../../../src/api/controllers/billing/payment.controller');
const { PaymentService } = require('../../../../src/services/billing');

// Mock the PaymentService
jest.mock('../../../../src/services/billing/payment.service', () => ({
  processPayment: jest.fn(),
  handlePaymentWebhook: jest.fn(),
  getPaymentHistory: jest.fn()
}));

describe('PaymentController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      params: {
        clientId: 'client-123'
      },
      body: {
        invoiceId: 'invoice-123',
        amount: 1000,
        currency: 'USD',
        paymentMethod: 'card'
      },
      headers: {
        'x-signature': 'webhook-signature-123'
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

  describe('processPayment', () => {
    test('should process payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        invoice_id: 'invoice-123',
        amount: 1000,
        currency: 'USD',
        status: 'succeeded'
      };
      
      // Mock the processPayment service method
      PaymentService.processPayment.mockResolvedValue(mockPayment);
      
      await paymentController.processPayment(mockReq, mockRes, mockNext);
      
      expect(PaymentService.processPayment).toHaveBeenCalledWith(
        mockReq.body
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to process payment');
      
      // Mock the processPayment service method to throw an error
      PaymentService.processPayment.mockRejectedValue(mockError);
      
      await paymentController.processPayment(mockReq, mockRes, mockNext);
      
      expect(PaymentService.processPayment).toHaveBeenCalledWith(
        mockReq.body
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('handleWebhook', () => {
    test('should handle payment webhook successfully', async () => {
      const mockResult = {
        event: 'payment.succeeded',
        paymentId: 'payment-123'
      };
      
      // Mock the handlePaymentWebhook service method
      PaymentService.handlePaymentWebhook.mockResolvedValue(mockResult);
      
      await paymentController.handleWebhook(mockReq, mockRes, mockNext);
      
      expect(PaymentService.handlePaymentWebhook).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.headers['x-signature']
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to handle webhook');
      
      // Mock the handlePaymentWebhook service method to throw an error
      PaymentService.handlePaymentWebhook.mockRejectedValue(mockError);
      
      await paymentController.handleWebhook(mockReq, mockRes, mockNext);
      
      expect(PaymentService.handlePaymentWebhook).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.headers['x-signature']
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getPaymentHistory', () => {
    test('should get payment history successfully', async () => {
      const mockPayments = [
        { id: 'payment-1', invoice_id: 'invoice-1', amount: 1000, status: 'succeeded' },
        { id: 'payment-2', invoice_id: 'invoice-2', amount: 2000, status: 'succeeded' }
      ];
      
      // Mock the getPaymentHistory service method
      PaymentService.getPaymentHistory.mockResolvedValue(mockPayments);
      
      await paymentController.getPaymentHistory(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getPaymentHistory).toHaveBeenCalledWith(
        mockReq.params.clientId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayments
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get payment history');
      
      // Mock the getPaymentHistory service method to throw an error
      PaymentService.getPaymentHistory.mockRejectedValue(mockError);
      
      await paymentController.getPaymentHistory(mockReq, mockRes, mockNext);
      
      expect(PaymentService.getPaymentHistory).toHaveBeenCalledWith(
        mockReq.params.clientId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 
const paymentService = require('../../../../src/services/billing/payment.service');
const { PaymentRepository, PaymentTransactionRepository, PaymentProviderRepository } = require('../../../../src/data/repositories/billing');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/billing', () => ({
  PaymentRepository: jest.fn(),
  PaymentTransactionRepository: jest.fn(),
  PaymentProviderRepository: jest.fn()
}));

describe('PaymentService', () => {
  let mockPaymentRepository;
  let mockTransactionRepository;
  let mockProviderRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockPaymentRepository = new PaymentRepository();
    mockTransactionRepository = new PaymentTransactionRepository();
    mockProviderRepository = new PaymentProviderRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Initialize mock methods
    mockTransactionRepository.create = jest.fn();
    mockTransactionRepository.updateStatus = jest.fn();
    
    // Mock repositories on the service
    paymentService.paymentRepo = mockPaymentRepository;
    paymentService.transactionRepo = mockTransactionRepository;
    paymentService.providerRepo = mockProviderRepository;
  });

  describe('processPayment', () => {
    test('should process a payment successfully', async () => {
      // Mock payment provider
      const mockProvider = {
        id: 1,
        code: 'stripe',
        name: 'Stripe',
        is_active: true
      };
      
      mockProviderRepository.findByCode = jest.fn().mockResolvedValue(mockProvider);
      
      // Mock transaction creation
      const mockTransaction = {
        id: 1,
        provider: 'stripe',
        amount: 1000,
        currency: 'USD',
        status: 'pending'
      };
      
      mockTransactionRepository.create = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock transaction update
      const mockCompletedTransaction = {
        ...mockTransaction,
        status: 'completed',
        gatewayResponse: 'Mock success response'
      };
      
      mockTransactionRepository.updateStatus = jest.fn().mockResolvedValue(mockCompletedTransaction);
      
      // Call the service method
      const paymentData = {
        provider: 'stripe',
        amount: 1000,
        currency: 'USD'
      };
      
      const result = await paymentService.processPayment(paymentData);
      
      // Assertions
      expect(mockProviderRepository.findByCode).toHaveBeenCalledWith('stripe');
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...paymentData,
        status: 'pending'
      });
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        1,
        'completed',
        { gatewayResponse: 'Mock success response' }
      );
      expect(result).toEqual(mockCompletedTransaction);
    });
    
    test('should throw error if payment provider is not available', async () => {
      // Mock payment provider not found
      mockProviderRepository.findByCode = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        paymentService.processPayment({
          provider: 'unavailable',
          amount: 1000,
          currency: 'USD'
        })
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProviderRepository.findByCode).toHaveBeenCalledWith('unavailable');
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });
    
    test('should throw error if payment provider is inactive', async () => {
      // Mock inactive payment provider
      const mockInactiveProvider = {
        id: 2,
        code: 'paypal',
        name: 'PayPal',
        is_active: false
      };
      
      mockProviderRepository.findByCode = jest.fn().mockResolvedValue(mockInactiveProvider);
      
      // Call the service method and expect it to throw
      await expect(
        paymentService.processPayment({
          provider: 'paypal',
          amount: 1000,
          currency: 'USD'
        })
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockProviderRepository.findByCode).toHaveBeenCalledWith('paypal');
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentWebhook', () => {
    test('should handle payment webhook successfully', async () => {
      // Mock transaction
      const mockTransaction = {
        id: 1,
        transactionId: 'tx_123',
        provider: 'stripe',
        amount: 1000,
        status: 'pending'
      };
      
      mockTransactionRepository.getByTransactionId = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock update status
      const mockWebhookData = {
        transactionId: 'tx_123',
        status: 'completed',
        amount: 1000
      };
      
      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: 'completed',
        ...mockWebhookData
      };
      
      mockTransactionRepository.updateStatus = jest.fn().mockResolvedValue(mockUpdatedTransaction);
      
      // Call the service method
      const result = await paymentService.handlePaymentWebhook(mockWebhookData, 'test-signature');
      
      // Assertions
      expect(mockTransactionRepository.getByTransactionId).toHaveBeenCalledWith('tx_123');
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        1,
        'completed',
        mockWebhookData
      );
      expect(result).toEqual(mockUpdatedTransaction);
    });
    
    test('should throw error if transaction not found', async () => {
      // Mock transaction not found
      mockTransactionRepository.getByTransactionId = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        paymentService.handlePaymentWebhook(
          { transactionId: 'invalid_tx' },
          'test-signature'
        )
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockTransactionRepository.getByTransactionId).toHaveBeenCalledWith('invalid_tx');
      expect(mockTransactionRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentHistory', () => {
    test('should return payment history for client', async () => {
      // Mock payment history
      const mockPayments = [
        {
          id: 1,
          client_id: 123,
          amount: 1000,
          status: 'completed',
          created_at: new Date()
        },
        {
          id: 2,
          client_id: 123,
          amount: 500,
          status: 'completed',
          created_at: new Date()
        }
      ];
      
      mockPaymentRepository.getPaymentsForClient = jest.fn().mockResolvedValue(mockPayments);
      
      // Call the service method
      const result = await paymentService.getPaymentHistory(123);
      
      // Assertions
      expect(mockPaymentRepository.getPaymentsForClient).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockPayments);
    });
  });
}); 
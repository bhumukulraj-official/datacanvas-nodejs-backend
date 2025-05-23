const { PaymentRepository, PaymentTransactionRepository, PaymentProviderRepository } = require('../../../data/repositories/billing');
const { CustomError } = require('../../utils/error.util');

class PaymentService {
  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.transactionRepo = new PaymentTransactionRepository();
    this.providerRepo = new PaymentProviderRepository();
  }

  async processPayment(paymentData) {
    const provider = await this.providerRepo.findByCode(paymentData.provider);
    if (!provider || !provider.is_active) {
      throw new CustomError('Payment provider not available', 400);
    }

    const transaction = await this.transactionRepo.create({
      ...paymentData,
      status: 'pending'
    });

    // TODO: Integrate with payment gateway
    return this.transactionRepo.updateStatus(
      transaction.id, 
      'completed', 
      { gatewayResponse: 'Mock success response' }
    );
  }

  async handlePaymentWebhook(webhookData, signature) {
    const transaction = await this.transactionRepo.getByTransactionId(
      webhookData.transactionId
    );
    
    if (!transaction) {
      throw new CustomError('Transaction not found', 404);
    }

    // TODO: Verify webhook signature
    return this.transactionRepo.updateStatus(
      transaction.id,
      webhookData.status,
      webhookData
    );
  }

  async getPaymentHistory(clientId) {
    return this.paymentRepo.getPaymentsForClient(clientId);
  }
}

module.exports = new PaymentService(); 
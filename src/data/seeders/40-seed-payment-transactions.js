'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Check if the payment_transactions table exists with the right columns
      const [tableInfo] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'payment_transactions'
      `, { transaction: t });
      
      // Get column names for logging
      const columns = tableInfo.map(row => row.column_name);
      console.log('Available columns in payment_transactions:', columns);
      
      if (columns.length === 0) {
        console.log('payment_transactions table does not exist or has no columns');
        return;
      }

      // Get invoice IDs instead of payment IDs
      const [invoices] = await queryInterface.sequelize.query(
        "SELECT id FROM billing.invoices LIMIT 3",
        { transaction: t }
      );
      
      if (invoices.length === 0) {
        console.log('No invoices found to create transactions');
        return;
      }
      
      // Get payment gateway IDs
      const [gateways] = await queryInterface.sequelize.query(
        "SELECT id, name FROM billing.payment_gateways LIMIT 2",
        { transaction: t }
      );
      
      if (gateways.length === 0) {
        console.log('No payment gateways found to create transactions');
        return;
      }
      
      // Find gateway IDs by name or default to first gateway
      const stripeGatewayId = gateways.find(g => g.name.includes('Stripe'))?.id || gateways[0].id;
      const paypalGatewayId = gateways.find(g => g.name.includes('PayPal'))?.id || gateways[0].id;
      
      // Generate transaction IDs
      const transactionIds = Array(invoices.length).fill(0).map(() => 
        crypto.randomBytes(16).toString('hex').toUpperCase()
      );
      
      // Insert payment transactions based on available columns
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        const gatewayId = i % 2 === 0 ? stripeGatewayId : paypalGatewayId;
        const transactionId = transactionIds[i];
        const status = i === invoices.length - 1 ? 'failed' : 'completed';
        const createdAt = new Date(Date.now() - (i * 86400000)); // One day apart
        
        await queryInterface.sequelize.query(`
          INSERT INTO billing.payment_transactions (
            invoice_id, gateway_id, transaction_id, 
            amount, currency, status, 
            response_data, created_at, updated_at
          ) VALUES (
            ${invoice.id},
            ${gatewayId},
            '${transactionId}',
            ${500 + (i * 250)}.00,
            'USD',
            '${status}',
            '${JSON.stringify({
              result: status === 'completed' ? 'success' : 'error',
              transaction_id: transactionId,
              timestamp: createdAt.toISOString(),
              error_message: status === 'failed' ? 'Payment processing error: Insufficient funds' : null
            })}',
            '${createdAt.toISOString()}',
            '${createdAt.toISOString()}'
          );
        `, { transaction: t });
        
        // Add a failed attempt before the successful one for the first invoice
        if (i === 0 && status === 'completed') {
          const failedAttemptDate = new Date(createdAt.getTime() - 3600000); // 1 hour before
          const failedTransactionId = crypto.randomBytes(16).toString('hex').toUpperCase();
          
          await queryInterface.sequelize.query(`
            INSERT INTO billing.payment_transactions (
              invoice_id, gateway_id, transaction_id, 
              amount, currency, status, 
              response_data, created_at, updated_at
            ) VALUES (
              ${invoice.id},
              ${gatewayId},
              '${failedTransactionId}',
              ${500 + (i * 250)}.00,
              'USD',
              'failed',
              '${JSON.stringify({
                result: 'error',
                transaction_id: failedTransactionId,
                error_code: 'card_declined',
                timestamp: failedAttemptDate.toISOString(),
                error_message: 'Payment processing error: Card declined'
              })}',
              '${failedAttemptDate.toISOString()}',
              '${failedAttemptDate.toISOString()}'
            );
          `, { transaction: t });
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.payment_transactions;
      `, { transaction: t });
    });
  }
};

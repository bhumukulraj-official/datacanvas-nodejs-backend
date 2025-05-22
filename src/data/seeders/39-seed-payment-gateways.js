'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Check if the payment_gateways table exists with the right columns
      const [tableInfo] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'payment_gateways'
      `, { transaction: t });
      
      // Get column names for logging
      const columns = tableInfo.map(row => row.column_name);
      console.log('Available columns in payment_gateways:', columns);
      
      // Get payment provider codes
      const [providers] = await queryInterface.sequelize.query(
        "SELECT id, code FROM billing.payment_providers WHERE is_active = true LIMIT 3",
        { transaction: t }
      );
      
      if (providers.length === 0) {
        console.log('No payment providers found to create gateways');
        return;
      }
      
      // Generate webhook secrets
      const stripeWebhookSecret = crypto.randomBytes(24).toString('hex');
      const paypalWebhookSecret = crypto.randomBytes(24).toString('hex');
      
      // Insert payment gateways
      await queryInterface.sequelize.query(`
        INSERT INTO billing.payment_gateways (
          name, provider, is_active, config, 
          created_at, updated_at
        ) VALUES
          (
            'Stripe Payment Gateway', 
            'stripe', 
            true, 
            '{"api_version": "2023-08-16", "public_key": "pk_test_stripe123", "private_key_encryption_id": 1, "webhook_url": "https://api.portfolio-backend.com/webhooks/stripe", "webhook_secret": "${stripeWebhookSecret}", "test_mode": true}', 
            NOW(), 
            NOW()
          ),
          (
            'PayPal Payment Gateway', 
            'paypal', 
            true, 
            '{"mode": "sandbox", "client_id_encryption_id": 1, "client_secret_encryption_id": 1, "webhook_url": "https://api.portfolio-backend.com/webhooks/paypal", "webhook_secret": "${paypalWebhookSecret}", "test_mode": true}', 
            NOW(), 
            NOW()
          ),
          (
            'Bank Transfer Gateway', 
            'bank_transfer', 
            true, 
            '{"account_name": "Portfolio Backend Inc", "account_number_encryption_id": 2, "routing_number_encryption_id": 2, "bank_name": "Example Bank", "test_mode": false}', 
            NOW(), 
            NOW()
          );
      `, { transaction: t });
      
      // Check if webhooks table exists and has correct structure
      try {
        const [webhookTableInfo] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'billing' AND table_name = 'webhooks'
        `, { transaction: t });
        
        const webhookColumns = webhookTableInfo.map(row => row.column_name);
        console.log('Available columns in webhooks:', webhookColumns);
        
        if (webhookColumns.includes('provider') && webhookColumns.includes('event_type')) {
          // Insert webhook configurations if the table has the right structure
          await queryInterface.sequelize.query(`
            INSERT INTO billing.webhooks (
              provider, event_type, payload, status,
              created_at, updated_at
            ) VALUES
              (
                'stripe', 
                'payment.created', 
                '{"endpoint_url": "https://api.portfolio-backend.com/webhooks/stripe/payment-created", "version": "1.0"}', 
                'pending', 
                NOW(), 
                NOW()
              ),
              (
                'stripe', 
                'payment.failed', 
                '{"endpoint_url": "https://api.portfolio-backend.com/webhooks/stripe/payment-failed", "version": "1.0"}', 
                'pending', 
                NOW(), 
                NOW()
              ),
              (
                'paypal', 
                'payment.completed', 
                '{"endpoint_url": "https://api.portfolio-backend.com/webhooks/paypal/payment-completed", "version": "1.0"}', 
                'pending', 
                NOW(), 
                NOW()
              ),
              (
                'paypal', 
                'payment.refunded', 
                '{"endpoint_url": "https://api.portfolio-backend.com/webhooks/paypal/payment-refunded", "version": "1.0"}', 
                'pending', 
                NOW(), 
                NOW()
              );
          `, { transaction: t });
        } else {
          console.log('Webhooks table has a different structure than expected. Skipping webhook seeding.');
        }
      } catch (error) {
        console.log('Error checking webhooks table:', error.message);
      }
      
      // Log the webhook secrets for testing purposes (in a real env, these would be securely stored)
      console.log('Stripe Webhook Secret (for testing only):', stripeWebhookSecret);
      console.log('PayPal Webhook Secret (for testing only):', paypalWebhookSecret);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Delete webhooks first (due to potential foreign key constraints)
      try {
        await queryInterface.sequelize.query(`
          DELETE FROM billing.webhooks;
        `, { transaction: t });
      } catch (error) {
        console.log('Error deleting webhooks:', error.message);
      }
      
      // Then delete payment gateways
      await queryInterface.sequelize.query(`
        DELETE FROM billing.payment_gateways;
      `, { transaction: t });
    });
  }
}; 
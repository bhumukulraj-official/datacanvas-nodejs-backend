'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert payment providers
      await queryInterface.sequelize.query(`
        INSERT INTO billing.payment_providers 
        (name, code, is_active, config, supports_refunds, supports_partial_payments, webhook_url, test_mode)
        VALUES
          ('Stripe', 'stripe', TRUE, 
          '{"apiVersion": "2023-08-16", "publishableKey": "pk_test_stripe", "secretKey": "sk_test_stripe"}',
          TRUE, TRUE, 'https://api.portfolio-backend.com/webhooks/stripe', TRUE),
          
          ('PayPal', 'paypal', TRUE, 
          '{"environment": "sandbox", "clientId": "client_id_paypal", "clientSecret": "client_secret_paypal"}',
          TRUE, TRUE, 'https://api.portfolio-backend.com/webhooks/paypal', TRUE),
          
          ('Square', 'square', FALSE, 
          '{"environment": "sandbox", "applicationId": "app_id_square", "accessToken": "access_token_square"}',
          TRUE, FALSE, 'https://api.portfolio-backend.com/webhooks/square', TRUE),
          
          ('Bank Transfer', 'bank_transfer', TRUE, 
          '{"accountName": "Portfolio Backend Inc", "accountNumber": "1234567890", "routingNumber": "111000025", "bankName": "Example Bank"}',
          FALSE, TRUE, NULL, FALSE)
        ON CONFLICT (code) DO UPDATE 
        SET name = EXCLUDED.name,
            is_active = EXCLUDED.is_active,
            config = EXCLUDED.config,
            supports_refunds = EXCLUDED.supports_refunds,
            supports_partial_payments = EXCLUDED.supports_partial_payments,
            webhook_url = EXCLUDED.webhook_url,
            test_mode = EXCLUDED.test_mode;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.payment_providers 
        WHERE code IN ('stripe', 'paypal', 'square', 'bank_transfer');
      `, { transaction: t });
    });
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE billing.payment_providers
        ADD COLUMN supports_refunds BOOLEAN DEFAULT FALSE,
        ADD COLUMN supports_partial_payments BOOLEAN DEFAULT FALSE,
        ADD COLUMN webhook_url VARCHAR(255),
        ADD COLUMN test_mode BOOLEAN DEFAULT FALSE;
        
        UPDATE billing.payment_providers 
        SET supports_refunds = TRUE 
        WHERE code = 'stripe';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      ALTER TABLE billing.payment_providers
      DROP COLUMN supports_refunds,
      DROP COLUMN supports_partial_payments,
      DROP COLUMN webhook_url,
      DROP COLUMN test_mode;
    `);
  }
}; 
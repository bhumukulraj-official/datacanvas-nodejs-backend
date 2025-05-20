'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO billing.payments (
          invoice_id, amount, payment_date, payment_method, 
          status_code, provider_response
        ) VALUES
          (1, 500.00, NOW(), 'credit_card', 
          'completed', '{"transaction_id":"PAY12345"}'),
          
          (1, 750.00, NOW(), 'bank_transfer', 
          'completed', '{"transaction_id":"PAY67890"}');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.payments 
        WHERE transaction_id IN ('PAY12345', 'PAY67890');
      `, { transaction: t });
    });
  }
}; 
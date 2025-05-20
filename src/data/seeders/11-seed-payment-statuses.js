'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO billing.payment_statuses (code, name, description)
        VALUES
          ('pending', 'Pending', 'Payment is being processed'),
          ('completed', 'Completed', 'Payment successfully received'),
          ('failed', 'Failed', 'Payment processing failed'),
          ('refunded', 'Refunded', 'Payment was refunded')
        ON CONFLICT (code) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.payment_statuses 
        WHERE code IN ('pending', 'completed', 'failed', 'refunded');
      `, { transaction: t });
    });
  }
}; 
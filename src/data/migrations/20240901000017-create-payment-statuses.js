'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Payment Statuses Table
        CREATE TABLE billing.payment_statuses (
          code VARCHAR(20) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert initial payment statuses
        INSERT INTO billing.payment_statuses (code, name, description, display_order)
        VALUES 
        ('pending', 'Pending', 'Payment is being processed', 1),
        ('completed', 'Completed', 'Payment successfully processed', 2),
        ('failed', 'Failed', 'Payment processing failed', 3),
        ('refunded', 'Refunded', 'Payment has been refunded', 4);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS billing.payment_statuses CASCADE;
      `, { transaction: t });
    });
  }
}; 
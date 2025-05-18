'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Invoice Statuses Table
        CREATE TABLE billing.invoice_statuses (
          code VARCHAR(20) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Payment Statuses Table
        CREATE TABLE billing.payment_statuses (
          code VARCHAR(20) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert initial invoice statuses
        INSERT INTO billing.invoice_statuses (code, name, description, display_order)
        VALUES 
        ('draft', 'Draft', 'Invoice being prepared', 1),
        ('sent', 'Sent', 'Invoice sent to client', 2),
        ('paid', 'Paid', 'Invoice has been paid', 3),
        ('overdue', 'Overdue', 'Payment deadline has passed', 4),
        ('cancelled', 'Cancelled', 'Invoice has been cancelled', 5);

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
        DROP TABLE IF EXISTS billing.invoice_statuses CASCADE;
      `, { transaction: t });
    });
  }
}; 
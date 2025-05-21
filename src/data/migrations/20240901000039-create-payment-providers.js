'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE TABLE billing.payment_providers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          config JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO billing.payment_providers 
        (name, code, is_active, config)
        VALUES
        ('Stripe', 'stripe', TRUE, '{"apiVersion": "2023-08-16"}'),
        ('PayPal', 'paypal', TRUE, '{"environment": "sandbox"}');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS billing.payment_providers;
    `);
  }
}; 
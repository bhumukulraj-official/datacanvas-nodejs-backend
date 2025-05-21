'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE TABLE billing.payment_gateways (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          provider VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          config JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE billing.payment_transactions (
          id SERIAL PRIMARY KEY,
          invoice_id INT REFERENCES billing.invoices(id),
          gateway_id INT REFERENCES billing.payment_gateways(id),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) NOT NULL,
          transaction_id VARCHAR(255),
          response_data JSONB,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE billing.webhooks (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          provider VARCHAR(50) NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          attempts INT DEFAULT 0,
          next_retry_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_webhooks_provider ON billing.webhooks(provider);
        CREATE INDEX idx_webhooks_status ON billing.webhooks(status);

        ALTER TABLE billing.payment_transactions
        ADD COLUMN distributed_xid VARCHAR(100);

        -- Remove the direct encryption in migration
        -- Application should handle encryption with proper key management
      `, { transaction: t });

      // Add documentation about encryption requirements
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN billing.payment_transactions.response_data IS 
        'Should be encrypted by application layer using secure key management';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS billing.payment_transactions;
        DROP TABLE IF EXISTS billing.payment_gateways;
        DROP TABLE IF EXISTS billing.webhooks;
      `, { transaction: t });
    });
  }
}; 
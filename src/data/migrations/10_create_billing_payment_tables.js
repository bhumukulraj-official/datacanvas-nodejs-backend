'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Payments Table
        CREATE TABLE billing.payments (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          invoice_id INT REFERENCES billing.invoices(id) ON DELETE CASCADE,
          client_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          payment_date DATE NOT NULL,
          payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'bank_transfer', 'paypal')),
          payment_provider VARCHAR(50),
          transaction_id VARCHAR(255),
          status_code VARCHAR(20) REFERENCES billing.payment_statuses(code) DEFAULT 'completed',
          provider_response JSONB DEFAULT '{}',
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Security comment for PCI compliance
        COMMENT ON COLUMN billing.payments.provider_response IS 'Encrypted. Contains sensitive payment information that must be stored encrypted.';

        -- Indexes for Payments
        CREATE INDEX idx_payments_invoice_id ON billing.payments(invoice_id);
        CREATE INDEX idx_payments_client_id ON billing.payments(client_id);
        CREATE INDEX idx_payments_payment_date ON billing.payments(payment_date);
        CREATE INDEX idx_payments_status_code ON billing.payments(status_code);
        CREATE INDEX idx_payments_transaction_id ON billing.payments(transaction_id);
        CREATE INDEX idx_payments_is_deleted ON billing.payments(is_deleted);
        CREATE INDEX idx_payments_uuid ON billing.payments(uuid);
        CREATE INDEX idx_payments_provider_response ON billing.payments USING GIN(provider_response);
        CREATE INDEX idx_payments_metadata ON billing.payments USING GIN(metadata);
        CREATE INDEX idx_payments_created_at_brin ON billing.payments USING BRIN(created_at);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS billing.payments CASCADE;
      `, { transaction: t });
    });
  }
}; 
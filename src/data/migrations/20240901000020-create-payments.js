'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add transaction isolation level
    return queryInterface.sequelize.transaction({
      isolationLevel: Sequelize.Transaction.SERIALIZABLE
    }, async (t) => {
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
          provider_response BYTEA, -- Encrypted using pgcrypto
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Security comment for PCI compliance
        COMMENT ON COLUMN billing.payments.provider_response IS 'Encrypted using pgcrypto. Contains sensitive payment information.';

        -- Create encryption function if it doesn't exist
        CREATE OR REPLACE FUNCTION billing.encrypt_provider_response(data JSONB, key TEXT) RETURNS BYTEA AS $$
        BEGIN
          RETURN pgp_sym_encrypt(data::text, key);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        CREATE OR REPLACE FUNCTION billing.decrypt_provider_response(data BYTEA, key TEXT) RETURNS JSONB AS $$
        BEGIN
          RETURN pgp_sym_decrypt(data, key)::jsonb;
        EXCEPTION WHEN OTHERS THEN
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Indexes for Payments
        CREATE INDEX idx_payments_invoice_id ON billing.payments(invoice_id);
        CREATE INDEX idx_payments_client_id ON billing.payments(client_id);
        CREATE INDEX idx_payments_payment_date ON billing.payments(payment_date);
        CREATE INDEX idx_payments_status_code ON billing.payments(status_code);
        CREATE INDEX idx_payments_transaction_id ON billing.payments(transaction_id);
        CREATE INDEX idx_payments_is_deleted ON billing.payments(is_deleted);
        CREATE INDEX idx_payments_uuid ON billing.payments(uuid);
        CREATE INDEX idx_payments_metadata ON billing.payments USING GIN(metadata);
        CREATE INDEX idx_payments_created_at_brin ON billing.payments USING BRIN(created_at);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS billing.encrypt_provider_response(JSONB, TEXT);
        DROP FUNCTION IF EXISTS billing.decrypt_provider_response(BYTEA, TEXT);
        DROP TABLE IF EXISTS billing.payments CASCADE;
      `, { transaction: t });
    });
  }
}; 
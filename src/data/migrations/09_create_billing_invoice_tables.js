'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Invoices Table
        CREATE TABLE billing.invoices (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          client_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          project_id INT REFERENCES content.projects(id) ON DELETE SET NULL,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
          status_code VARCHAR(20) REFERENCES billing.invoice_statuses(code) DEFAULT 'draft',
          issue_date DATE NOT NULL,
          due_date DATE NOT NULL CHECK (due_date >= issue_date),
          paid_date DATE,
          notes TEXT,
          payment_provider VARCHAR(50),
          payment_details JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Invoice Items Table
        CREATE TABLE billing.invoice_items (
          id SERIAL PRIMARY KEY,
          invoice_id INT REFERENCES billing.invoices(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Security comment for PCI compliance
        COMMENT ON COLUMN billing.invoices.payment_details IS 'Encrypted. Contains sensitive payment information that must be stored encrypted.';

        -- Indexes for Invoices
        CREATE INDEX idx_invoices_client_id ON billing.invoices(client_id);
        CREATE INDEX idx_invoices_project_id ON billing.invoices(project_id);
        CREATE INDEX idx_invoices_status_code ON billing.invoices(status_code);
        CREATE INDEX idx_invoices_invoice_number ON billing.invoices(invoice_number);
        CREATE INDEX idx_invoices_due_date ON billing.invoices(due_date);
        CREATE INDEX idx_invoices_is_deleted ON billing.invoices(is_deleted);
        CREATE INDEX idx_invoices_uuid ON billing.invoices(uuid);
        CREATE INDEX idx_invoices_payment_details ON billing.invoices USING GIN(payment_details);
        CREATE INDEX idx_invoices_metadata ON billing.invoices USING GIN(metadata);
        CREATE INDEX idx_invoices_created_at_brin ON billing.invoices USING BRIN(created_at);

        -- Indexes for Invoice Items
        CREATE INDEX idx_invoice_items_invoice_id ON billing.invoice_items(invoice_id);
        CREATE INDEX idx_invoice_items_is_deleted ON billing.invoice_items(is_deleted);
        CREATE INDEX idx_invoice_items_metadata ON billing.invoice_items USING GIN(metadata);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS billing.invoice_items CASCADE;
        DROP TABLE IF EXISTS billing.invoices CASCADE;
      `, { transaction: t });
    });
  }
}; 
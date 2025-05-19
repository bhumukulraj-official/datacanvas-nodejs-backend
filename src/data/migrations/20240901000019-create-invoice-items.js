'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
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
      `, { transaction: t });
    });
  }
}; 
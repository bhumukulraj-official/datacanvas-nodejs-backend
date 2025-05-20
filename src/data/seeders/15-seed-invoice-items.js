'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO billing.invoice_items (
          invoice_id, description, quantity, unit_price, amount
        ) VALUES
          (1, 'Web Development Services', 10, 100.00, 1000.00),
          (1, 'Consulting Hours', 5, 150.00, 750.00);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.invoice_items 
        WHERE id IN (
          SELECT id FROM billing.invoice_items
          ORDER BY created_at DESC
          LIMIT 2
        );
      `, { transaction: t });
    });
  }
}; 
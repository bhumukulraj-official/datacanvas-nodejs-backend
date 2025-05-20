'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO billing.invoice_statuses (code, name, description)
        VALUES
          ('draft', 'Draft', 'Invoice is in preparation'),
          ('sent', 'Sent', 'Invoice has been sent to client'),
          ('paid', 'Paid', 'Invoice has been fully paid'),
          ('overdue', 'Overdue', 'Invoice payment is late')
        ON CONFLICT (code) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.invoice_statuses 
        WHERE code IN ('draft', 'sent', 'paid', 'overdue');
      `, { transaction: t });
    });
  }
}; 
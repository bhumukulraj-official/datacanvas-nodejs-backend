'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const [clients] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'client'",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO billing.invoices (
          invoice_number, client_id, issue_date, due_date, 
          amount, status_code, metadata
        ) VALUES
          ('INV-001', ${clients[0].id}, NOW(), NOW() + INTERVAL '30 days',
          1500.00, 'draft', '{"project_id": 1}'),
          
          ('INV-002', ${clients[1].id}, NOW(), NOW() + INTERVAL '15 days',
          2500.00, 'sent', '{"project_id": 2}'),
          
          ('INV-003', ${clients[2].id}, NOW(), NOW() + INTERVAL '45 days',
          3500.00, 'sent', '{"project_id": 3}')
        ON CONFLICT (invoice_number) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.invoices 
        WHERE invoice_number IN ('INV-001', 'INV-002', 'INV-003');
      `, { transaction: t });
    });
  }
}; 
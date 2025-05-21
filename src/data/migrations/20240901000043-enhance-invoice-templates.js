'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE billing.invoice_templates
        ADD COLUMN template_type VARCHAR(50) DEFAULT 'html',
        ADD COLUMN variables JSONB DEFAULT '{}',
        ADD COLUMN styles TEXT,
        ADD COLUMN footer TEXT;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      ALTER TABLE billing.invoice_templates
      DROP COLUMN template_type,
      DROP COLUMN variables,
      DROP COLUMN styles,
      DROP COLUMN footer;
    `);
  }
}; 
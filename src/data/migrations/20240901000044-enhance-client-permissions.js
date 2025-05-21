'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE content.client_project_permissions
        ADD COLUMN can_view_invoices BOOLEAN DEFAULT FALSE,
        ADD COLUMN can_make_payments BOOLEAN DEFAULT FALSE,
        ADD COLUMN can_invite_collaborators BOOLEAN DEFAULT FALSE,
        ADD COLUMN custom_permissions JSONB DEFAULT '{}';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      ALTER TABLE content.client_project_permissions
      DROP COLUMN can_view_invoices,
      DROP COLUMN can_make_payments,
      DROP COLUMN can_invite_collaborators,
      DROP COLUMN custom_permissions;
    `);
  }
}; 
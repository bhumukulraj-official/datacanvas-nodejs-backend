'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE TABLE content.client_project_permissions (
          id SERIAL PRIMARY KEY,
          assignment_id INT REFERENCES content.project_client_assignments(id) ON DELETE CASCADE,
          can_view_files BOOLEAN DEFAULT TRUE,
          can_view_updates BOOLEAN DEFAULT TRUE,
          can_download BOOLEAN DEFAULT TRUE,
          can_message BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS content.client_project_permissions;
    `);
  }
}; 
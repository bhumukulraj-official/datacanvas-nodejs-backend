'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Project Client Assignments Table
        CREATE TABLE content.project_client_assignments (
          id SERIAL PRIMARY KEY,
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          client_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMPTZ,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          custom_fields JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_project_client_assignments_project_id ON content.project_client_assignments(project_id);
        CREATE INDEX idx_project_client_assignments_client_id ON content.project_client_assignments(client_id);
        CREATE INDEX idx_project_client_assignments_is_active ON content.project_client_assignments(is_active);
        CREATE UNIQUE INDEX idx_unique_active_project_client ON content.project_client_assignments(project_id, client_id) WHERE is_active = TRUE;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.project_client_assignments CASCADE;
      `, { transaction: t });
    });
  }
}; 
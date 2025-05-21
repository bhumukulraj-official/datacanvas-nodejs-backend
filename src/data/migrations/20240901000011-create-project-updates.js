'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Project Updates Table
        CREATE TABLE content.project_updates (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          created_by INT REFERENCES auth.users(id),
          notify_client BOOLEAN DEFAULT TRUE,
          notified_at TIMESTAMPTZ,
          client_viewed_at TIMESTAMPTZ,
          additional_data JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes for Project Updates
        CREATE INDEX idx_project_updates_created_by ON content.project_updates(created_by);
        CREATE INDEX idx_project_updates_update_date ON content.project_updates(update_date);
        CREATE INDEX idx_project_updates_client_viewed_at ON content.project_updates(client_viewed_at);
        CREATE INDEX idx_project_updates_is_deleted ON content.project_updates(is_deleted);
        CREATE INDEX idx_project_updates_uuid ON content.project_updates(uuid);
        CREATE INDEX idx_project_updates_additional_data ON content.project_updates USING GIN(additional_data);
        CREATE INDEX idx_project_updates_created_at_brin ON content.project_updates USING BRIN(created_at);
        
        -- Composite index for querying updates by project with date sorting (common query pattern)
        -- This index covers idx_project_updates_project_id so we don't need that separately
        CREATE INDEX idx_project_updates_project_date ON content.project_updates(project_id, update_date DESC);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.project_updates CASCADE;
      `, { transaction: t });
    });
  }
}; 
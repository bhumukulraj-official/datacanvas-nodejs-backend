'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Project Visibility Settings Table
        CREATE TABLE content.project_visibility (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id INT REFERENCES content.projects(id),
          visibility_level VARCHAR(20) CHECK (visibility_level IN ('public', 'private', 'client_only')),
          client_exceptions JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_project_visibility_timestamp
        BEFORE UPDATE ON content.project_visibility
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_project_visibility_timestamp ON content.project_visibility;
        DROP TABLE IF EXISTS content.project_visibility CASCADE;
      `, { transaction: t });
    });
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Projects Table
        CREATE TABLE content.projects (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          thumbnail_url VARCHAR(255),
          tags TEXT[],
          technologies TEXT[],
          github_url VARCHAR(255),
          live_url VARCHAR(255),
          is_featured BOOLEAN DEFAULT FALSE,
          visibility VARCHAR(15) DEFAULT 'portfolio' CHECK (visibility IN ('portfolio', 'private', 'client_only')),
          status_code VARCHAR(20) REFERENCES content.project_statuses(code) DEFAULT 'draft',
          custom_fields JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes for Projects
        CREATE INDEX idx_projects_user_id ON content.projects(user_id);
        CREATE INDEX idx_projects_status_code ON content.projects(status_code);
        CREATE INDEX idx_projects_tags ON content.projects USING GIN(tags);
        CREATE INDEX idx_projects_technologies ON content.projects USING GIN(technologies);
        CREATE INDEX idx_projects_is_featured ON content.projects(is_featured);
        CREATE INDEX idx_projects_visibility ON content.projects(visibility);
        CREATE INDEX idx_projects_is_deleted ON content.projects(is_deleted);
        CREATE INDEX idx_projects_uuid ON content.projects(uuid);
        CREATE INDEX idx_projects_custom_fields ON content.projects USING GIN(custom_fields);
        CREATE INDEX idx_projects_created_at_brin ON content.projects USING BRIN(created_at);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.projects CASCADE;
      `, { transaction: t });
    });
  }
}; 
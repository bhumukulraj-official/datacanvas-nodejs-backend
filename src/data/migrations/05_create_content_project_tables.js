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

        -- Project Files Table
        CREATE TABLE content.project_files (
          id SERIAL PRIMARY KEY,
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          file_url VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          file_size BIGINT,
          file_type VARCHAR(100),
          version INT DEFAULT 1,
          uploaded_by INT REFERENCES auth.users(id),
          description TEXT,
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

        -- Indexes for Project Updates
        CREATE INDEX idx_project_updates_project_id ON content.project_updates(project_id);
        CREATE INDEX idx_project_updates_created_by ON content.project_updates(created_by);
        CREATE INDEX idx_project_updates_update_date ON content.project_updates(update_date);
        CREATE INDEX idx_project_updates_client_viewed_at ON content.project_updates(client_viewed_at);
        CREATE INDEX idx_project_updates_is_deleted ON content.project_updates(is_deleted);
        CREATE INDEX idx_project_updates_uuid ON content.project_updates(uuid);
        CREATE INDEX idx_project_updates_additional_data ON content.project_updates USING GIN(additional_data);
        CREATE INDEX idx_project_updates_created_at_brin ON content.project_updates USING BRIN(created_at);

        -- Indexes for Project Files
        CREATE INDEX idx_project_files_project_id ON content.project_files(project_id);
        CREATE INDEX idx_project_files_uploaded_by ON content.project_files(uploaded_by);
        CREATE INDEX idx_project_files_filename ON content.project_files(filename);
        CREATE INDEX idx_project_files_file_type ON content.project_files(file_type);
        CREATE INDEX idx_project_files_is_deleted ON content.project_files(is_deleted);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.project_files CASCADE;
        DROP TABLE IF EXISTS content.project_updates CASCADE;
        DROP TABLE IF EXISTS content.projects CASCADE;
      `, { transaction: t });
    });
  }
}; 
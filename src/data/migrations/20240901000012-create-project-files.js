'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Project Files Table
        CREATE TABLE content.project_files (
          id SERIAL PRIMARY KEY,
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          file_url VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          file_size BIGINT,
          file_type VARCHAR(100),
          version INT DEFAULT 1,
          uploaded_by INT REFERENCES auth.users(id) ON DELETE SET NULL,
          description TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

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
      `, { transaction: t });
    });
  }
}; 
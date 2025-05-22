'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get project IDs from existing seed data
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );
      
      if (projects.length === 0) {
        console.log('No projects found for visibility settings');
        return;
      }
      
      // Check if the project_visibility table exists with the right columns
      const [tableInfo] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'content' AND table_name = 'project_visibility'
      `, { transaction: t });
      
      // Get column names for logging
      const columns = tableInfo.map(row => row.column_name);
      console.log('Available columns in project_visibility:', columns);
      
      // First, let's drop any existing data
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_visibility;
      `, { transaction: t });
      
      // Insert visibility settings for different projects with the correct column names
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const visibilityLevel = i % 3 === 0 ? 'public' : (i % 3 === 1 ? 'private' : 'client_only');
        
        await queryInterface.sequelize.query(`
          INSERT INTO content.project_visibility (
            project_id, visibility_level, client_exceptions, 
            created_at, updated_at
          ) VALUES (
            ${project.id},
            '${visibilityLevel}',
            '${JSON.stringify(i % 2 === 0 ? {"allow_view": [2, 3]} : {})}',
            NOW(),
            NOW()
          );
        `, { transaction: t });
      }
      
      // Update projects table to match visibility settings if visibility column exists
      try {
        await queryInterface.sequelize.query(`
          UPDATE content.projects p
          SET visibility = v.visibility_level
          FROM content.project_visibility v
          WHERE p.id = v.project_id;
        `, { transaction: t });
      } catch (error) {
        console.log('Could not update projects table, visibility column might not exist:', error.message);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Reset projects visibility to default if column exists
      try {
        await queryInterface.sequelize.query(`
          UPDATE content.projects
          SET visibility = 'portfolio'
          WHERE visibility IS NOT NULL;
        `, { transaction: t });
      } catch (error) {
        console.log('Could not reset visibility in projects table:', error.message);
      }
      
      // Remove all project visibility settings
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_visibility;
      `, { transaction: t });
    });
  }
}; 
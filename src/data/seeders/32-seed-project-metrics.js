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
        console.log('No projects found to create metrics');
        return;
      }
      
      // Define sample metrics for each project
      for (const project of projects) {
        await queryInterface.sequelize.query(`
          INSERT INTO metrics.project_metrics (
            project_id, metric_name, metric_value, period_start, period_end, 
            metadata, created_at, updated_at
          ) VALUES
            (
              ${project.id}, 
              'hours_logged', 
              ${(Math.random() * 100 + 20).toFixed(2)}, 
              NOW() - INTERVAL '30 days', 
              NOW() - INTERVAL '1 day', 
              '{"developer_id": 1, "category": "development"}', 
              NOW(), 
              NOW()
            ),
            (
              ${project.id}, 
              'completion_percentage', 
              ${(Math.random() * 100).toFixed(2)}, 
              NOW() - INTERVAL '30 days', 
              NOW(), 
              '{"milestone": "MVP", "updated_by": 1}', 
              NOW(), 
              NOW()
            ),
            (
              ${project.id}, 
              'git_commits', 
              ${Math.floor(Math.random() * 50 + 5)}, 
              NOW() - INTERVAL '7 days', 
              NOW(), 
              '{"repository": "main", "branch": "develop"}', 
              NOW(), 
              NOW()
            ),
            (
              ${project.id}, 
              'tasks_completed', 
              ${Math.floor(Math.random() * 20 + 3)}, 
              NOW() - INTERVAL '14 days', 
              NOW(), 
              '{"sprint": "Sprint 3", "total_tasks": ${Math.floor(Math.random() * 30 + 10)}}', 
              NOW(), 
              NOW()
            );
        `, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM metrics.project_metrics;
      `, { transaction: t });
    });
  }
}; 
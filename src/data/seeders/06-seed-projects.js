'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Ensure schema exists
      await queryInterface.sequelize.query(
        'CREATE SCHEMA IF NOT EXISTS content;', 
        { transaction: t }
      );
      
      // Fix: Select only code from project_statuses
      const [statuses] = await queryInterface.sequelize.query(
        "SELECT code FROM content.project_statuses",
        { transaction: t }
      );
      
      const [clients] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'client'",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO content.projects (
          title, description, status_code, 
          user_id, custom_fields, created_at, updated_at
        ) VALUES
          (
            'E-commerce Platform', 
            'Full-stack development', 
            'in_progress', 
            ${clients[0].id}, 
            '{"stack":["React","Node","PostgreSQL"]}', 
            NOW(), 
            NOW()
          ),
          (
            'Portfolio Website', 
            'Design and development', 
            'planned', 
            ${clients[1].id}, 
            '{"design_approved":false}', 
            NOW(), 
            NOW()
          ),
          (
            'Mobile Analytics', 
            'Analytics dashboard', 
            'on_hold', 
            ${clients[2].id}, 
            '{"team_size":5}', 
            NOW(), 
            NOW()
          );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.projects 
        WHERE title IN (
          'E-commerce Platform',
          'Portfolio Website',
          'Mobile Analytics'
        );
      `, { transaction: t });
    });
  }
}; 
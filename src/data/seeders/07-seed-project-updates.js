'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO content.project_updates (
          project_id, created_by, title, description, additional_data
        ) VALUES
          (${projects[0].id}, ${users[0].id}, 'Initial Setup', 
          'Project kickoff completed', '{"progress":20}'),
          
          (${projects[0].id}, ${users[0].id}, 'API Development', 
          'Backend services implemented', '{"progress":45}'),
          
          (${projects[1].id}, ${users[0].id}, 'Design Approved', 
          'Client approved final mockups', '{"progress":65}');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_updates 
        WHERE id IN (
          SELECT id FROM content.project_updates
          ORDER BY created_at DESC
          LIMIT 3
        );
      `, { transaction: t });
    });
  }
}; 
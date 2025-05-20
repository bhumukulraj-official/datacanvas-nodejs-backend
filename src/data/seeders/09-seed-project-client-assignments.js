'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );
      const [clients] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'client'",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO content.project_client_assignments (
          project_id, client_id, is_active
        ) VALUES
          (${projects[0].id}, ${clients[0].id}, true),
          (${projects[1].id}, ${clients[1].id}, true),
          (${projects[2].id}, ${clients[2].id}, true),
          (${projects[0].id}, ${clients[3].id}, true);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_client_assignments 
        WHERE id IN (
          SELECT id FROM content.project_client_assignments
          ORDER BY project_id
          LIMIT 4
        );
      `, { transaction: t });
    });
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO messaging.messages (
          sender_id, receiver_id, content, is_read, project_id
        ) VALUES
          (${users[0].id}, ${users[1].id}, 
          'Please review the latest changes', false, 1),
          
          (${users[1].id}, ${users[0].id}, 
          'Changes approved', true, 1),
          
          (${users[2].id}, ${users[0].id}, 
          'Need clarification on design', false, 2);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.messages 
        WHERE id IN (
          SELECT id FROM messaging.messages
          ORDER BY created_at DESC
          LIMIT 3
        );
      `, { transaction: t });
    });
  }
}; 
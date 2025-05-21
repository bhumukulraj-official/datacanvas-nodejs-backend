'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Create public view for skills
        CREATE OR REPLACE VIEW public_api.skills AS
        SELECT 
          s.id,
          s.name,
          s.category,
          s.proficiency,
          s.description,
          s.is_highlighted,
          u.name AS user_name,
          p.avatar_url AS user_avatar
        FROM content.skills s
        JOIN auth.users u ON s.user_id = u.id
        LEFT JOIN content.profiles p ON u.id = p.user_id
        WHERE s.is_deleted = FALSE AND u.is_deleted = FALSE;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS public_api.skills;
    `);
  }
}; 
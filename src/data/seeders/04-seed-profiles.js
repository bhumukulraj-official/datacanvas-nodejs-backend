'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get user IDs from existing seed data
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE email LIKE '%@example.com'",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO content.profiles (
          user_id, bio, metadata, 
          created_at, updated_at
        )
        SELECT 
          users.id,
          CASE 
            WHEN users.email = 'client1@example.com' 
              THEN 'Digital marketing specialist focused on tech startups'
            ELSE 'Seasoned full-stack developer with 10+ years experience'
          END AS bio,
          CASE
            WHEN users.email = 'client1@example.com'
              THEN '{"website":"https://marketingpro.com","twitter":"@client1"}'::jsonb
            ELSE '{"website":"https://portfolio.example.com","linkedin":"https://linkedin.com/in/admin"}'::jsonb
          END AS metadata,
          NOW(),
          NOW()
        FROM auth.users
        WHERE email LIKE '%@example.com';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.profiles 
        WHERE user_id IN (
          SELECT id FROM auth.users WHERE email LIKE '%@example.com'
        );
      `, { transaction: t });
    });
  }
}; 
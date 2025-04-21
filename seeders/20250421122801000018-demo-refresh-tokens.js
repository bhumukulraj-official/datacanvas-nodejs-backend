'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs from the database
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a mapping of usernames to IDs
    const userIds = users.reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const refreshTokens = [
      {
        user_id: userIds['admin'],
        token: 'admin-refresh-token-123',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        created_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        token: 'john-refresh-token-456',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        created_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        token: 'jane-refresh-token-789',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        created_at: new Date()
      }
    ];

    return queryInterface.bulkInsert('refresh_tokens', refreshTokens, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('refresh_tokens', null, {});
  }
}; 
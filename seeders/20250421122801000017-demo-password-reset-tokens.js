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

    const passwordResetTokens = [
      {
        user_id: userIds['admin'],
        token: 'admin-reset-token-123',
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        created_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        token: 'john-reset-token-456',
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        created_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        token: 'jane-reset-token-789',
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        created_at: new Date()
      }
    ];

    return queryInterface.bulkInsert('password_reset_tokens', passwordResetTokens, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('password_reset_tokens', null, {});
  }
}; 
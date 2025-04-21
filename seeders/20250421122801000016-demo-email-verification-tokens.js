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

    const emailVerificationTokens = [
      {
        user_id: userIds['admin'],
        token: 'admin-verification-token-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        token: 'john-verification-token-456',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        token: 'jane-verification-token-789',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: new Date()
      }
    ];

    return queryInterface.bulkInsert('email_verification_tokens', emailVerificationTokens, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('email_verification_tokens', null, {});
  }
}; 
'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get unverified user IDs from existing seed data
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE email_verified = FALSE",
        { transaction: t }
      );

      if (users.length === 0) {
        console.log('No unverified users found to create email verification tokens');
        return;
      }

      // Create email verification tokens for unverified users
      for (const user of users) {
        await queryInterface.sequelize.query(`
          INSERT INTO auth.email_verification_tokens (
            user_id, token, expires_at, created_at
          )
          VALUES (
            ${user.id},
            '${crypto.randomBytes(32).toString('hex')}',
            NOW() + INTERVAL '24 hours',
            NOW()
          );
        `, { transaction: t });
      }

      // Add an expired token for testing
      if (users.length > 0) {
        await queryInterface.sequelize.query(`
          INSERT INTO auth.email_verification_tokens (
            user_id, token, expires_at, created_at
          )
          VALUES (
            ${users[0].id},
            '${crypto.randomBytes(32).toString('hex')}',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '3 days'
          );
        `, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM auth.email_verification_tokens;
      `, { transaction: t });
    });
  }
}; 
'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get user IDs from existing seed data
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE email LIKE '%@example.com'",
        { transaction: t }
      );

      if (users.length === 0) {
        console.log('No users found to create refresh tokens');
        return;
      }

      // Create refresh tokens for existing users
      await queryInterface.sequelize.query(`
        INSERT INTO auth.refresh_tokens (
          user_id, token, expires_at, device_info, is_revoked, created_at
        )
        VALUES
          (${users[0].id}, '${crypto.randomBytes(32).toString('hex')}', 
          NOW() + INTERVAL '7 days', 
          '{"device":"Chrome on macOS", "ip":"192.168.1.1"}', 
          false, NOW()),

          (${users[1].id}, '${crypto.randomBytes(32).toString('hex')}', 
          NOW() + INTERVAL '14 days', 
          '{"device":"Safari on iPhone", "ip":"192.168.1.2"}', 
          false, NOW()),

          (${users[0].id}, '${crypto.randomBytes(32).toString('hex')}', 
          NOW() + INTERVAL '30 days', 
          '{"device":"Firefox on Windows", "ip":"192.168.1.3"}', 
          true, NOW() - INTERVAL '2 days'),

          (${users[2].id}, '${crypto.randomBytes(32).toString('hex')}', 
          NOW() + INTERVAL '7 days', 
          '{"device":"Chrome on Android", "ip":"192.168.1.4"}', 
          false, NOW());
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM auth.refresh_tokens 
        WHERE id IN (
          SELECT id FROM auth.refresh_tokens
          ORDER BY created_at DESC
          LIMIT 4
        );
      `, { transaction: t });
    });
  }
}; 
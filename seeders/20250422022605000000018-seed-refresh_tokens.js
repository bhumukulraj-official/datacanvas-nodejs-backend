'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Create tokens with different expiry dates
    const tokens = [];
    for (let i = 0; i < 8; i++) {
      tokens.push(crypto.randomBytes(32).toString('hex'));
    }

    return queryInterface.bulkInsert('refresh_tokens', [
      {
        user_id: 1, // admin_user
        token: tokens[0],
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        created_at: now,
        updated_at: now
      },
      {
        user_id: 2, // editor_main
        token: tokens[1],
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        created_at: now,
        updated_at: now
      },
      {
        user_id: 3, // writer_one
        token: tokens[2],
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        created_at: now,
        updated_at: now
      },
      {
        user_id: 4, // regular_user
        token: tokens[3],
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        created_at: now,
        updated_at: now
      },
      {
        user_id: 5, // content_creator
        token: tokens[4],
        expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // admin_user (second token)
        token: tokens[5],
        expires_at: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        created_at: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), // Created 29 days ago
        updated_at: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: 2, // editor_main (second token)
        token: tokens[6],
        expires_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
        created_at: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), // Created 31 days ago
        updated_at: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: 4, // regular_user (second token)
        token: tokens[7],
        expires_at: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('refresh_tokens', null, {});
  }
}; 
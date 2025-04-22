'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    return queryInterface.bulkInsert('email_verification_tokens', [
      {
        id: uuidv4(),
        user_id: 1,
        token: '2a5f9f7a1e3d8c6b4a2e5f9d7c1a3b5e9f7d1c3a5b7e9d1c3a5b7e9f7d1c3a5',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 2,
        token: '7b3e9f1c5a2d6b8e4f7a1c3e9d5b7f1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3',
        expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 3,
        token: '5e9d7c1a3b5e9f7d1c3a5b7e9d1c3a5b7e9f7d1c3a5b7e9d1c3a5b7e9f7d1c3',
        expires_at: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 4,
        token: '1c3a5b7e9d1c3a5b7e9f7d1c3a5b7e9d1c3a5b7e9f7d1c3a5b7e9d1c3a5b7e9',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 5,
        token: '9f7d1c3a5b7e9d1c3a5b7e9f7d1c3a5b7e9d1c3a5b7e9f7d1c3a5b7e9d1c3a5',
        expires_at: new Date(now.getTime() + 36 * 60 * 60 * 1000), // 36 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 6,
        token: '3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9',
        expires_at: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 7,
        token: 'a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b',
        expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        user_id: 8,
        token: 'e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('email_verification_tokens', null, {});
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    return queryInterface.bulkInsert('password_reset_tokens', [
      {
        id: 1,
        user_id: 1,
        token: 'f7a1c3e9d5b7f1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b',
        expires_at: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        user_id: 2,
        token: 'c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7',
        expires_at: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        user_id: 3,
        token: '3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c',
        expires_at: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        user_id: 4,
        token: '9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a',
        expires_at: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        created_at: now,
        updated_at: now
      },
      {
        id: 5,
        user_id: 5,
        token: '1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d',
        expires_at: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: 6,
        user_id: 6,
        token: '5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b',
        expires_at: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        created_at: now,
        updated_at: now
      },
      {
        id: 7,
        user_id: 7,
        token: 'b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3',
        expires_at: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        created_at: now,
        updated_at: now
      },
      {
        id: 8,
        user_id: 8,
        token: '7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e3d9c5a7b1e',
        expires_at: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('password_reset_tokens', null, {});
  }
}; 
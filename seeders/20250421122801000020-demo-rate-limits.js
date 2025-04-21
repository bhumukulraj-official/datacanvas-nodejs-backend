'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const userMap = users[0].reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const rateLimits = [
      {
        user_id: userMap['admin'],
        ip_address: '192.168.1.1',
        endpoint: '/api/projects',
        request_count: 5,
        window_start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        window_end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        api_type: 'rest',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userMap['john_doe'],
        ip_address: '192.168.1.2',
        endpoint: '/api/profile',
        request_count: 3,
        window_start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        window_end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        api_type: 'rest',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userMap['jane_smith'],
        ip_address: '192.168.1.3',
        endpoint: '/api/blog',
        request_count: 10,
        window_start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        window_end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        api_type: 'rest',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('rate_limits', rateLimits, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rate_limits', null, {});
  }
}; 
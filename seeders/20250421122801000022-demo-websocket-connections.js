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

    const websocketConnections = [
      {
        user_id: userMap['admin'],
        connection_id: 'admin-connection-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        connected_at: new Date(),
        last_heartbeat: new Date(),
        disconnected_at: null
      },
      {
        user_id: userMap['johndoe'],
        connection_id: 'john-connection-456',
        ip_address: '192.168.1.2',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        connected_at: new Date(),
        last_heartbeat: new Date(),
        disconnected_at: null
      },
      {
        user_id: userMap['janesmith'],
        connection_id: 'jane-connection-789',
        ip_address: '192.168.1.3',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        connected_at: new Date(),
        last_heartbeat: new Date(),
        disconnected_at: null
      }
    ];

    await queryInterface.bulkInsert('websocket_connections', websocketConnections, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('websocket_connections', null, {});
  }
}; 
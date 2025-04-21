'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs and their connection IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const userMap = users[0].reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const connections = await queryInterface.sequelize.query(
      `SELECT user_id, connection_id FROM websocket_connections;`
    );
    const connectionMap = connections[0].reduce((acc, conn) => {
      acc[conn.user_id] = conn.connection_id;
      return acc;
    }, {});

    const websocketMessages = [
      {
        type: 'chat',
        payload: JSON.stringify({
          content: 'Hello team!',
          room: 'general'
        }),
        user_id: userMap['admin'],
        connection_id: connectionMap[userMap['admin']],
        message_id: 'msg-' + Date.now() + '-1',
        sent_at: new Date(),
        delivered_at: new Date(),
        read_at: new Date(),
        delivery_status: 'delivered',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        type: 'notification',
        payload: JSON.stringify({
          title: 'New Project',
          message: 'A new project has been created'
        }),
        user_id: userMap['johndoe'],
        connection_id: connectionMap[userMap['johndoe']],
        message_id: 'msg-' + Date.now() + '-2',
        sent_at: new Date(),
        delivered_at: new Date(),
        read_at: null,
        delivery_status: 'delivered',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        type: 'system',
        payload: JSON.stringify({
          event: 'user_status',
          status: 'online'
        }),
        user_id: userMap['janesmith'],
        connection_id: connectionMap[userMap['janesmith']],
        message_id: 'msg-' + Date.now() + '-3',
        sent_at: new Date(),
        delivered_at: null,
        read_at: null,
        delivery_status: 'pending',
        retry_count: 2,
        last_retry_at: new Date(),
        error_message: 'Connection timeout',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('websocket_messages', websocketMessages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('websocket_messages', null, {});
  }
}; 
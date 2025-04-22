'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Get connection IDs from the previous seed file
    const connectionIds = await queryInterface.sequelize.query(
      'SELECT connection_id FROM websocket_connections WHERE deleted_at IS NULL LIMIT 5',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Generate random message IDs
    const messageIds = [];
    for (let i = 0; i < 8; i++) {
      messageIds.push(`msg_${crypto.randomBytes(12).toString('hex')}`);
    }
    
    return queryInterface.bulkInsert('websocket_messages', [
      {
        type: 'notification',
        payload: JSON.stringify({
          title: 'New Comment',
          body: 'Someone commented on your post',
          action: 'view_comment',
          reference_id: 123
        }),
        user_id: 4, // regular_user
        connection_id: connectionIds[0]?.connection_id || 'conn_default_1',
        message_id: messageIds[0],
        sent_at: now,
        delivered_at: now,
        read_at: null,
        delivery_status: 'delivered',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        type: 'text',
        payload: JSON.stringify({
          from_user_id: 1,
          to_user_id: 2,
          message: 'Hi there, can you review the new blog post?',
          is_private: true
        }),
        user_id: 1, // admin_user
        connection_id: connectionIds[1]?.connection_id || 'conn_default_2',
        message_id: messageIds[1],
        sent_at: now,
        delivered_at: now,
        read_at: now,
        delivery_status: 'delivered',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        type: 'command',
        payload: JSON.stringify({
          message: 'System maintenance scheduled in 30 minutes',
          severity: 'warning',
          actions: ['acknowledge', 'dismiss']
        }),
        user_id: 1, // admin_user (broadcast to all)
        connection_id: connectionIds[2]?.connection_id || 'conn_default_3',
        message_id: messageIds[2],
        sent_at: now,
        delivered_at: null,
        read_at: null,
        delivery_status: 'pending',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        type: 'notification',
        payload: JSON.stringify({
          title: 'New Follower',
          body: 'User JohnDoe started following you',
          action: 'view_profile',
          reference_id: 456
        }),
        user_id: 3, // writer_one
        connection_id: connectionIds[3]?.connection_id || 'conn_default_4',
        message_id: messageIds[3],
        sent_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        delivered_at: new Date(now.getTime() - 30 * 60 * 1000 + 2000), // 2 seconds after sent
        read_at: new Date(now.getTime() - 25 * 60 * 1000), // 25 minutes ago
        delivery_status: 'delivered',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: new Date(now.getTime() - 30 * 60 * 1000),
        updated_at: new Date(now.getTime() - 25 * 60 * 1000),
        deleted_at: null
      },
      {
        type: 'command',
        payload: JSON.stringify({
          entity: 'blog_post',
          entity_id: 42,
          action: 'update',
          fields_changed: ['content', 'title']
        }),
        user_id: 2, // editor_main
        connection_id: connectionIds[4]?.connection_id || 'conn_default_5',
        message_id: messageIds[4],
        sent_at: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        delivered_at: new Date(now.getTime() - 15 * 60 * 1000 + 1500), // 1.5 seconds after sent
        read_at: null,
        delivery_status: 'delivered',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: new Date(now.getTime() - 15 * 60 * 1000),
        updated_at: new Date(now.getTime() - 15 * 60 * 1000 + 1500),
        deleted_at: null
      },
      {
        type: 'text',
        payload: JSON.stringify({
          from_user_id: 3,
          to_user_id: 5,
          message: 'Do you have time to collaborate on the new project?',
          is_private: true
        }),
        user_id: 3, // writer_one
        connection_id: connectionIds[0]?.connection_id || 'conn_default_1',
        message_id: messageIds[5],
        sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        delivered_at: null,
        read_at: null,
        delivery_status: 'failed',
        retry_count: 3,
        last_retry_at: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        error_message: 'Recipient connection unavailable',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
        deleted_at: null
      },
      {
        type: 'notification',
        payload: JSON.stringify({
          title: 'Comment Liked',
          body: 'User JaneDoe liked your comment',
          action: 'view_comment',
          reference_id: 789
        }),
        user_id: 5, // content_creator
        connection_id: connectionIds[1]?.connection_id || 'conn_default_2',
        message_id: messageIds[6],
        sent_at: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        delivered_at: new Date(now.getTime() - 45 * 60 * 1000 + 3000), // 3 seconds after sent
        read_at: new Date(now.getTime() - 40 * 60 * 1000), // 40 minutes ago
        delivery_status: 'delivered',
        retry_count: 0,
        last_retry_at: null,
        error_message: null,
        created_at: new Date(now.getTime() - 45 * 60 * 1000),
        updated_at: new Date(now.getTime() - 40 * 60 * 1000),
        deleted_at: null
      },
      {
        type: 'command',
        payload: JSON.stringify({
          message: 'Your account has been logged in from a new device',
          severity: 'info',
          actions: ['view_details', 'dismiss']
        }),
        user_id: 4, // regular_user
        connection_id: connectionIds[2]?.connection_id || 'conn_default_3',
        message_id: messageIds[7],
        sent_at: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        delivered_at: new Date(now.getTime() - 10 * 60 * 1000 + 2500), // 2.5 seconds after sent
        read_at: null,
        delivery_status: 'delivered',
        retry_count: 1,
        last_retry_at: new Date(now.getTime() - 10 * 60 * 1000 + 1000), // 1 second after first attempt
        error_message: null,
        created_at: new Date(now.getTime() - 10 * 60 * 1000),
        updated_at: new Date(now.getTime() - 10 * 60 * 1000 + 2500),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('websocket_messages', null, {});
  }
}; 
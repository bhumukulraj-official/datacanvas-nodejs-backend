'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Generate random connection IDs
    const connectionIds = [];
    for (let i = 0; i < 8; i++) {
      connectionIds.push(`conn_${crypto.randomBytes(12).toString('hex')}`);
    }
    
    return queryInterface.bulkInsert('websocket_connections', [
      {
        user_id: 1, // admin_user
        connection_id: connectionIds[0],
        status: 'connected',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        connected_at: now,
        last_heartbeat: now,
        disconnected_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        connection_id: connectionIds[1],
        status: 'connected',
        ip_address: '10.0.0.15',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        connected_at: now,
        last_heartbeat: now,
        disconnected_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        connection_id: connectionIds[2],
        status: 'connected',
        ip_address: '203.0.113.42',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        connected_at: now,
        last_heartbeat: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        disconnected_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        connection_id: connectionIds[3],
        status: 'disconnected',
        ip_address: '198.51.100.73',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        connected_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        last_heartbeat: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        disconnected_at: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        created_at: new Date(now.getTime() - 30 * 60 * 1000),
        updated_at: new Date(now.getTime() - 10 * 60 * 1000),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        connection_id: connectionIds[4],
        status: 'idle',
        ip_address: '172.16.254.1',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        connected_at: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        last_heartbeat: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        disconnected_at: null,
        created_at: new Date(now.getTime() - 45 * 60 * 1000),
        updated_at: new Date(now.getTime() - 5 * 60 * 1000),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user (second connection)
        connection_id: connectionIds[5],
        status: 'connected',
        ip_address: '10.0.0.5',
        user_agent: 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        connected_at: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        last_heartbeat: new Date(now.getTime() - 1 * 60 * 1000), // 1 minute ago
        disconnected_at: null,
        created_at: new Date(now.getTime() - 10 * 60 * 1000),
        updated_at: new Date(now.getTime() - 1 * 60 * 1000),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main (disconnected connection)
        connection_id: connectionIds[6],
        status: 'disconnected',
        ip_address: '10.0.0.15',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        connected_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        last_heartbeat: new Date(now.getTime() - 90 * 60 * 1000), // 90 minutes ago
        disconnected_at: new Date(now.getTime() - 85 * 60 * 1000), // 85 minutes ago
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 85 * 60 * 1000),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user (deleted connection)
        connection_id: connectionIds[7],
        status: 'disconnected',
        ip_address: '198.51.100.42',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        connected_at: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        last_heartbeat: new Date(now.getTime() - 23.5 * 60 * 60 * 1000), // 23.5 hours ago
        disconnected_at: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23 hours ago
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 23 * 60 * 60 * 1000),
        deleted_at: now // Soft deleted now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('websocket_connections', null, {});
  }
}; 
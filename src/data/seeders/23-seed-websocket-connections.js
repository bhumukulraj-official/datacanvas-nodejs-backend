'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get users for websocket connections
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users LIMIT 4",
        { transaction: t }
      );

      // Connection IDs for referencing in messages
      const connectionIds = [
        `conn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        `conn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        `conn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        `conn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
      ];

      // Insert websocket connections
      await queryInterface.sequelize.query(`
        INSERT INTO messaging.websocket_connections (
          connection_id, user_id, ip_address, user_agent, 
          connection_status, last_ping_at, connected_at, 
          disconnected_at, metadata, tls_enforced
        ) VALUES
          ('${connectionIds[0]}', ${users[0].id}, '192.168.1.10', 
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
          'connected', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '2 hours', 
          NULL, '{"device": "desktop", "browser": "chrome"}', true),
          
          ('${connectionIds[1]}', ${users[1].id}, '192.168.1.11', 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 
          'connected', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '30 minutes', 
          NULL, '{"device": "mobile", "browser": "safari"}', true),
          
          ('${connectionIds[2]}', ${users[2].id}, '192.168.1.12', 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
          'idle', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '1 hour', 
          NULL, '{"device": "desktop", "browser": "chrome"}', true),
          
          ('${connectionIds[3]}', ${users[3].id}, '192.168.1.13', 
          'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36', 
          'disconnected', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours', 
          NOW() - INTERVAL '3 hours', '{"device": "mobile", "browser": "chrome"}', true);
      `, { transaction: t });

      // Insert websocket messages
      await queryInterface.sequelize.query(`
        INSERT INTO messaging.websocket_messages (
          connection_id, message_id, message_type, direction, 
          payload, status, error_details, created_at
        ) VALUES
          ('${connectionIds[0]}', 'msg_${Date.now()}_1', 'message_sent', 'outgoing', 
          '{"to": ${users[1].id}, "content": "Hello, how are you?", "conversation_id": 1}', 
          'sent', NULL, NOW() - INTERVAL '15 minutes'),
          
          ('${connectionIds[1]}', 'msg_${Date.now()}_2', 'message_received', 'incoming', 
          '{"from": ${users[0].id}, "content": "Hello, how are you?", "conversation_id": 1}', 
          'received', NULL, NOW() - INTERVAL '15 minutes'),
          
          ('${connectionIds[1]}', 'msg_${Date.now()}_3', 'message_sent', 'outgoing', 
          '{"to": ${users[0].id}, "content": "I am good, thanks!", "conversation_id": 1}', 
          'sent', NULL, NOW() - INTERVAL '14 minutes'),
          
          ('${connectionIds[0]}', 'msg_${Date.now()}_4', 'message_received', 'incoming', 
          '{"from": ${users[1].id}, "content": "I am good, thanks!", "conversation_id": 1}', 
          'received', NULL, NOW() - INTERVAL '14 minutes'),
          
          ('${connectionIds[2]}', 'msg_${Date.now()}_5', 'user_status', 'outgoing', 
          '{"status": "away", "last_active": "${new Date(Date.now() - 1500000).toISOString()}"}', 
          'sent', NULL, NOW() - INTERVAL '25 minutes'),
          
          ('${connectionIds[3]}', 'msg_${Date.now()}_6', 'connection_error', 'incoming', 
          '{"error_code": "timeout", "message": "Connection timed out"}', 
          'error', 'Client connection timed out after 30 seconds', NOW() - INTERVAL '3 hours');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Delete websocket messages first (due to foreign key constraints)
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.websocket_messages;
      `, { transaction: t });
      
      // Then delete the connections
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.websocket_connections;
      `, { transaction: t });
    });
  }
}; 
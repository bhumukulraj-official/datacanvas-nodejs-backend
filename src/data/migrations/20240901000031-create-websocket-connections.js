'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- WebSocket Connections Table
        CREATE TABLE messaging.websocket_connections (
          id SERIAL PRIMARY KEY,
          connection_id VARCHAR(100) UNIQUE NOT NULL,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          ip_address VARCHAR(45),
          user_agent TEXT,
          connection_status VARCHAR(20) DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'idle')),
          last_ping_at TIMESTAMPTZ,
          connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          disconnected_at TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- WebSocket Messages Table
        CREATE TABLE messaging.websocket_messages (
          id SERIAL PRIMARY KEY,
          connection_id VARCHAR(100) REFERENCES messaging.websocket_connections(connection_id) ON DELETE CASCADE,
          message_id VARCHAR(100) UNIQUE NOT NULL,
          message_type VARCHAR(50) NOT NULL,
          direction VARCHAR(10) CHECK (direction IN ('incoming', 'outgoing')),
          payload JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'error')),
          error_details TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_websocket_connections_user_id ON messaging.websocket_connections(user_id);
        CREATE INDEX idx_websocket_connections_status ON messaging.websocket_connections(connection_status);
        CREATE INDEX idx_websocket_connections_last_ping ON messaging.websocket_connections(last_ping_at);
        CREATE INDEX idx_websocket_connections_metadata ON messaging.websocket_connections USING GIN(metadata);
        
        CREATE INDEX idx_websocket_messages_connection_id ON messaging.websocket_messages(connection_id);
        CREATE INDEX idx_websocket_messages_message_type ON messaging.websocket_messages(message_type);
        CREATE INDEX idx_websocket_messages_direction ON messaging.websocket_messages(direction);
        CREATE INDEX idx_websocket_messages_created_at ON messaging.websocket_messages(created_at);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_websocket_connections_timestamp
        BEFORE UPDATE ON messaging.websocket_connections
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Add TLS requirement
        ALTER TABLE messaging.websocket_connections
        ADD COLUMN tls_enforced BOOLEAN DEFAULT TRUE;

        -- Add encryption requirement
        ALTER TABLE messaging.websocket_messages
        ADD COLUMN encryption_type VARCHAR(20) DEFAULT 'TLS1.3';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_websocket_connections_timestamp ON messaging.websocket_connections;
        DROP TABLE IF EXISTS messaging.websocket_messages CASCADE;
        DROP TABLE IF EXISTS messaging.websocket_connections CASCADE;
      `, { transaction: t });
    });
  }
}; 
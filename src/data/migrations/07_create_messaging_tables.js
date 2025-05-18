'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Messages Table
        CREATE TABLE messaging.messages (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          sender_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          receiver_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          project_id INT REFERENCES content.projects(id) ON DELETE SET NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Message Attachments Table
        CREATE TABLE messaging.message_attachments (
          id SERIAL PRIMARY KEY,
          message_id INT REFERENCES messaging.messages(id) ON DELETE CASCADE,
          file_url VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          file_size BIGINT,
          file_type VARCHAR(100),
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes for Messages
        CREATE INDEX idx_messages_sender_id ON messaging.messages(sender_id);
        CREATE INDEX idx_messages_receiver_id ON messaging.messages(receiver_id);
        CREATE INDEX idx_messages_project_id ON messaging.messages(project_id);
        CREATE INDEX idx_messages_is_read ON messaging.messages(is_read);
        CREATE INDEX idx_messages_is_deleted ON messaging.messages(is_deleted);
        CREATE INDEX idx_messages_uuid ON messaging.messages(uuid);
        CREATE INDEX idx_messages_metadata ON messaging.messages USING GIN(metadata);
        CREATE INDEX idx_messages_created_at_brin ON messaging.messages USING BRIN(created_at);

        -- Indexes for Message Attachments
        CREATE INDEX idx_message_attachments_message_id ON messaging.message_attachments(message_id);
        CREATE INDEX idx_message_attachments_file_type ON messaging.message_attachments(file_type);
        CREATE INDEX idx_message_attachments_is_deleted ON messaging.message_attachments(is_deleted);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS messaging.message_attachments CASCADE;
        DROP TABLE IF EXISTS messaging.messages CASCADE;
      `, { transaction: t });
    });
  }
}; 
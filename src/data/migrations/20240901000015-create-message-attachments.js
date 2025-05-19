'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
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
      `, { transaction: t });
    });
  }
}; 
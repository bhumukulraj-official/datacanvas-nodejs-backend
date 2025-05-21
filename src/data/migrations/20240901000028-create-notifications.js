'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Notifications Table
        CREATE TABLE messaging.notifications (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          link VARCHAR(255),
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes
        CREATE INDEX idx_notifications_user_id ON messaging.notifications(user_id);
        CREATE INDEX idx_notifications_type ON messaging.notifications(type);
        CREATE INDEX idx_notifications_is_read ON messaging.notifications(is_read);
        CREATE INDEX idx_notifications_created_at ON messaging.notifications(created_at);
        CREATE INDEX idx_notifications_is_deleted ON messaging.notifications(is_deleted);
        CREATE INDEX idx_notifications_metadata ON messaging.notifications USING GIN(metadata);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_notifications_timestamp
        BEFORE UPDATE ON messaging.notifications
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Add cryptographic signature
        ALTER TABLE messaging.notifications
        ADD COLUMN digital_signature VARCHAR(512);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_notifications_timestamp ON messaging.notifications;
        DROP TABLE IF EXISTS messaging.notifications CASCADE;
      `, { transaction: t });
    });
  }
}; 
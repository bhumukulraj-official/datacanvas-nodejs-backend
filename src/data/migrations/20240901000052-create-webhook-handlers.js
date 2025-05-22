'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Webhook Handlers Table
        CREATE TABLE messaging.webhook_handlers (
          event_type VARCHAR(50) PRIMARY KEY,
          handler_function VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          config JSONB DEFAULT '{}',
          description TEXT,
          priority INT DEFAULT 10,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_webhook_handlers_event_type ON messaging.webhook_handlers(event_type);
        CREATE INDEX idx_webhook_handlers_is_active ON messaging.webhook_handlers(is_active);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS messaging.webhook_handlers CASCADE;
      `, { transaction: t });
    });
  }
};
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE VIEW public_api.messages AS
        SELECT 
          m.id,
          m.uuid,
          m.sender_id,
          m.receiver_id,
          m.project_id,
          m.content,
          m.is_read,
          m.created_at,
          c.uuid AS conversation_uuid
        FROM messaging.messages m
        LEFT JOIN messaging.conversations c ON m.conversation_id = c.id
        WHERE m.is_deleted = FALSE;

        CREATE OR REPLACE VIEW public_api.conversations AS
        SELECT 
          c.id,
          c.uuid,
          c.subject,
          c.last_message_at,
          array_agg(cp.user_id) AS participant_ids
        FROM messaging.conversations c
        JOIN messaging.conversation_participants cp ON c.id = cp.conversation_id
        WHERE c.is_deleted = FALSE AND cp.is_deleted = FALSE
        GROUP BY c.id;

        CREATE OR REPLACE VIEW public_api.message_endpoints AS
        SELECT
          'POST /messages' AS endpoint,
          'Create new message' AS description,
          'messaging' AS schema_name,
          'messages' AS table_name
        UNION ALL
        SELECT
          'GET /messages/{id}', 
          'Get message details',
          'messaging',
          'messages';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS public_api.messages;
      DROP VIEW IF EXISTS public_api.conversations;
      DROP VIEW IF EXISTS public_api.message_endpoints;
    `);
  }
}; 
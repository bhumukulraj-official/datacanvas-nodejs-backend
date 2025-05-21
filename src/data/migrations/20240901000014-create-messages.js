'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for required schemas and tables
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            -- Check if messaging schema exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'messaging') THEN
              RAISE EXCEPTION 'Required schema "messaging" does not exist. This migration depends on "20240901000002-create-schemas.js"';
            END IF;
            
            -- Check if auth.users table exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                          WHERE table_schema = 'auth' 
                          AND table_name = 'users') THEN
              RAISE EXCEPTION 'Required table "auth.users" does not exist. This migration depends on "20240901000004-create-users.js"';
            END IF;
            
            -- Check if content.projects table exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                          WHERE table_schema = 'content' 
                          AND table_name = 'projects') THEN
              RAISE EXCEPTION 'Required table "content.projects" does not exist. This migration depends on "20240901000010-create-projects.js"';
            END IF;
          END
          $$;
        `, { transaction: t });

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

          -- Indexes for Messages with consistent GIN index
          CREATE INDEX idx_messages_sender_id ON messaging.messages(sender_id);
          CREATE INDEX idx_messages_receiver_id ON messaging.messages(receiver_id);
          CREATE INDEX idx_messages_project_id ON messaging.messages(project_id);
          CREATE INDEX idx_messages_is_read ON messaging.messages(is_read);
          CREATE INDEX idx_messages_is_deleted ON messaging.messages(is_deleted);
          CREATE INDEX idx_messages_uuid ON messaging.messages(uuid);
          CREATE INDEX idx_messages_metadata ON messaging.messages USING GIN(metadata);
          CREATE INDEX idx_messages_created_at_brin ON messaging.messages USING BRIN(created_at);
          CREATE INDEX idx_messages_sender_receiver ON messaging.messages(sender_id, receiver_id);
          
          -- Add partial index for common query patterns
          CREATE INDEX idx_messages_unread ON messaging.messages(receiver_id, created_at DESC) 
            WHERE is_read = FALSE AND is_deleted = FALSE;
          
          -- Add trigger for automatic updated_at timestamp
          CREATE TRIGGER update_messages_timestamp
          BEFORE UPDATE ON messaging.messages
          FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
          
          -- Add trigger to set deleted_at when is_deleted changes
          CREATE OR REPLACE FUNCTION messaging.set_message_deleted_at() RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
              NEW.deleted_at = CURRENT_TIMESTAMP;
            ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
              NEW.deleted_at = NULL;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER set_message_deleted_at
          BEFORE UPDATE OF is_deleted ON messaging.messages
          FOR EACH ROW EXECUTE FUNCTION messaging.set_message_deleted_at();
        `, { transaction: t });
        
        await queryInterface.sequelize.query(`
          ALTER TABLE messaging.messages
          ADD COLUMN content_moderated BOOLEAN DEFAULT FALSE,
          ADD COLUMN pii_detected BOOLEAN DEFAULT FALSE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in messages table creation:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema != 'messaging'
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'messaging'
            AND table_name = 'messages'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && dependencies[0].count > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on messaging.messages table. These will be dropped due to CASCADE.`);
          
          // Log the details for audit purposes
          await queryInterface.sequelize.query(`
            INSERT INTO metrics.user_activity_logs(
              action_type, entity_type, details
            ) VALUES (
              'migration_warning', 
              'messaging.messages', 
              jsonb_build_object(
                'message', 'Dependencies found during down migration',
                'dependency_count', ${dependencies[0].count}
              )
            )
            ON CONFLICT DO NOTHING;
          `, { transaction: t }).catch(err => {
            console.warn('Could not log to metrics table, continuing anyway:', err.message);
          });
        }
        
        // Drop triggers first
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS update_messages_timestamp ON messaging.messages;
          DROP TRIGGER IF EXISTS set_message_deleted_at ON messaging.messages;
          DROP FUNCTION IF EXISTS messaging.set_message_deleted_at();
        `, { transaction: t });
        
        // Then drop the table with cascade
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS messaging.messages CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in messages down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 
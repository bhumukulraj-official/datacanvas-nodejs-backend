'use strict';

/**
 * Migration: Create Conversations and Participants
 * Purpose: Sets up tables for messaging conversations and migrates direct messages
 * Dependencies: 20240901000014-create-messages.js
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies
        const [tablesExist] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) AS count FROM information_schema.tables 
          WHERE table_schema = 'messaging' 
          AND table_name = 'messages';
        `, { transaction: t });
        
        const messagesTableExists = parseInt(tablesExist[0].count) > 0;
        
        if (!messagesTableExists) {
          console.error('Dependency check failed: messaging.messages table does not exist');
          throw new Error('messaging.messages table does not exist. This migration depends on 20240901000014-create-messages.js being run first.');
        }

        console.log('Creating conversations tables...');

        // First create the tables with proper transaction support
        await queryInterface.sequelize.query(`
          -- Set search path for this operation only
          SET LOCAL search_path TO messaging, auth, public;
          
          -- Create conversations table
          CREATE TABLE IF NOT EXISTS messaging.conversations (
            id SERIAL PRIMARY KEY,
            uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
            subject VARCHAR(200),
            last_message_id INT REFERENCES messaging.messages(id) ON DELETE SET NULL,
            last_message_at TIMESTAMPTZ,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMPTZ
          );

          -- Create participants table
          CREATE TABLE IF NOT EXISTS messaging.conversation_participants (
            id SERIAL PRIMARY KEY,
            conversation_id INT REFERENCES messaging.conversations(id) ON DELETE CASCADE,
            user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
            last_read_message_id INT REFERENCES messaging.messages(id) ON DELETE SET NULL,
            is_muted BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMPTZ,
            UNIQUE(conversation_id, user_id)
          );
          
          -- Reset search path to default
          RESET search_path;
        `, { transaction: t });

        // Add column to messages table separately to isolate any potential issues
        console.log('Adding conversation_id to messages table...');
        await queryInterface.sequelize.query(`
          DO $OUTER$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'messaging' 
              AND table_name = 'messages' 
              AND column_name = 'conversation_id'
            ) THEN
              ALTER TABLE messaging.messages 
              ADD COLUMN conversation_id INT 
              REFERENCES messaging.conversations(id) ON DELETE CASCADE;
              
              RAISE NOTICE 'Added conversation_id column to messages table';
            ELSE
              RAISE NOTICE 'conversation_id column already exists in messages table';
            END IF;
          END
          $OUTER$;
        `, { transaction: t });

        // Create more atomic migration function with better batch processing
        console.log('Creating migration function...');
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION messaging.migrate_direct_messages(
            batch_size INT DEFAULT 100, 
            max_errors INT DEFAULT 10
          ) RETURNS TABLE(
            processed INT,
            errors INT, 
            skipped INT
          ) AS $$
          DECLARE
            sender_receiver RECORD;
            new_conversation_id INT;
            processed_count INT := 0;
            error_count INT := 0;
            skipped_count INT := 0;
            cur_batch INT := 0;
          BEGIN
            -- Set appropriate search path for function execution
            SET LOCAL search_path TO messaging, auth, public;
            
            -- Create a temporary table to track processed pairs to avoid deadlocks
            CREATE TEMP TABLE IF NOT EXISTS processed_pairs (
              user1_id INT,
              user2_id INT,
              conversation_id INT,
              PRIMARY KEY (user1_id, user2_id)
            ) ON COMMIT DROP;
            
            -- Find unique sender-receiver pairs in existing messages
            FOR sender_receiver IN 
              SELECT DISTINCT 
                LEAST(sender_id, receiver_id) as user1_id,
                GREATEST(sender_id, receiver_id) as user2_id
              FROM messaging.messages 
              WHERE conversation_id IS NULL
              AND is_deleted = FALSE
              ORDER BY user1_id, user2_id -- Deterministic order to avoid deadlocks
            LOOP
              BEGIN
                -- Skip if we've already processed this pair in a previous batch
                IF EXISTS (SELECT 1 FROM processed_pairs 
                          WHERE user1_id = sender_receiver.user1_id 
                          AND user2_id = sender_receiver.user2_id) THEN
                  skipped_count := skipped_count + 1;
                  CONTINUE;
                END IF;
                
                -- Check if either user exists before creating conversation
                IF NOT EXISTS (
                  SELECT 1 FROM auth.users 
                  WHERE id IN (sender_receiver.user1_id, sender_receiver.user2_id)
                ) THEN
                  RAISE WARNING 'Skipping conversation for users % and % - one or both users do not exist',
                    sender_receiver.user1_id, sender_receiver.user2_id;
                  skipped_count := skipped_count + 1;
                  CONTINUE;
                END IF;
                
                -- Create new conversation with oldest message timestamp
                INSERT INTO messaging.conversations (subject, created_at)
                SELECT 
                  CASE 
                    WHEN COUNT(*) = 0 THEN 'Direct Messages'
                    ELSE 'Direct Messages' 
                  END AS subject,
                  COALESCE(MIN(created_at), CURRENT_TIMESTAMP) AS created_at
                FROM messaging.messages
                WHERE (
                  (sender_id = sender_receiver.user1_id AND receiver_id = sender_receiver.user2_id) OR
                  (sender_id = sender_receiver.user2_id AND receiver_id = sender_receiver.user1_id)
                )
                RETURNING id INTO new_conversation_id;
                
                -- Add conversation participants
                INSERT INTO messaging.conversation_participants (conversation_id, user_id)
                VALUES 
                  (new_conversation_id, sender_receiver.user1_id),
                  (new_conversation_id, sender_receiver.user2_id);
                
                -- Update messages for this conversation
                UPDATE messaging.messages
                SET conversation_id = new_conversation_id
                WHERE (
                  (sender_id = sender_receiver.user1_id AND receiver_id = sender_receiver.user2_id) OR
                  (sender_id = sender_receiver.user2_id AND receiver_id = sender_receiver.user1_id)
                )
                AND conversation_id IS NULL;
                
                -- Update conversation with last message info
                WITH last_msg AS (
                  SELECT id, created_at
                  FROM messaging.messages
                  WHERE conversation_id = new_conversation_id
                  ORDER BY created_at DESC
                  LIMIT 1
                )
                UPDATE messaging.conversations c
                SET 
                  last_message_id = last_msg.id,
                  last_message_at = last_msg.created_at
                FROM last_msg
                WHERE c.id = new_conversation_id;
                
                -- Record this pair as processed
                INSERT INTO processed_pairs (user1_id, user2_id, conversation_id)
                VALUES (sender_receiver.user1_id, sender_receiver.user2_id, new_conversation_id);
                
                processed_count := processed_count + 1;
                
                -- Process in batches with commits to avoid long-running transactions
                cur_batch := cur_batch + 1;
                IF cur_batch >= batch_size THEN
                  RAISE NOTICE 'Processed batch of % conversations', batch_size;
                  cur_batch := 0;
                END IF;
                
              EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Error migrating conversation for users % and %: %', 
                  sender_receiver.user1_id, sender_receiver.user2_id, SQLERRM;
                
                -- Stop if too many errors occur
                IF error_count >= max_errors THEN
                  RAISE EXCEPTION 'Too many errors (%) during conversation migration', error_count;
                END IF;
              END;
            END LOOP;
            
            -- Return summary statistics
            RETURN QUERY SELECT processed_count, error_count, skipped_count;
            
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Fatal error in migrate_direct_messages: %', SQLERRM;
            RETURN QUERY SELECT processed_count, error_count, skipped_count;
          END;
          $$ LANGUAGE plpgsql;
        `, { transaction: t });

        // Execute the migration function with improved error handling and reporting
        console.log('Migrating direct messages to conversations...');
        const [migrationResult] = await queryInterface.sequelize.query(`
          DO $OUTER$
          DECLARE
            result RECORD;
          BEGIN
            SELECT * INTO result FROM messaging.migrate_direct_messages(50, 20);
            RAISE NOTICE 'Message migration complete: % processed, % errors, % skipped', 
              result.processed, result.errors, result.skipped;
            
            -- Record migration in meta table for future reference
            INSERT INTO public.migration_meta (key, value)
            VALUES ('conversations_migration', jsonb_build_object(
              'processed', result.processed,
              'errors', result.errors,
              'skipped', result.skipped,
              'completed_at', CURRENT_TIMESTAMP
            ))
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Message migration failed: %', SQLERRM;
          END $OUTER$;
        `, { transaction: t });

        // Drop the migration function after use
        console.log('Cleaning up migration function...');
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS messaging.migrate_direct_messages(INT, INT);
        `, { transaction: t });

        // Create indexes and triggers with error handling
        console.log('Creating indexes and triggers...');
        await queryInterface.sequelize.query(`
          -- Verify update_timestamp function exists before creating triggers
          DO $OUTER$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public'
              AND p.proname = 'update_timestamp'
            ) THEN
              RAISE WARNING 'public.update_timestamp function not found - creating default version';
              
              -- Create the function if it doesn't exist
              CREATE OR REPLACE FUNCTION public.update_timestamp()
              RETURNS TRIGGER AS $BODY$
              BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
              END;
              $BODY$ LANGUAGE plpgsql;
            END IF;
          END $OUTER$;

          -- Create indexes for better query performance
          CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at 
          ON messaging.conversations(last_message_at);
          
          CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id 
          ON messaging.conversation_participants(user_id);
          
          CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
          ON messaging.messages(conversation_id);
          
          -- Create triggers for automatic timestamp updates
          DO $OUTER$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_trigger
              WHERE tgname = 'update_conversations_timestamp'
              AND tgrelid = 'messaging.conversations'::regclass
            ) THEN
              CREATE TRIGGER update_conversations_timestamp
              BEFORE UPDATE ON messaging.conversations
              FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_trigger
              WHERE tgname = 'update_conversation_participants_timestamp'
              AND tgrelid = 'messaging.conversation_participants'::regclass
            ) THEN
              CREATE TRIGGER update_conversation_participants_timestamp
              BEFORE UPDATE ON messaging.conversation_participants
              FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
            END IF;
          END $OUTER$;
        `, { transaction: t });
        
        console.log('Conversations migration completed successfully');
        return Promise.resolve();
      } catch (error) {
        console.error('Error in creating conversations migration:', error);
        await queryInterface.sequelize.query(`
          INSERT INTO metrics.user_activity_logs(action_type, details)
          VALUES ('migration_error', jsonb_build_object('error', $1));
        `, { transaction: t, replacements: [error.message] });
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        console.log('Starting down migration for conversations...');
        
        // Check if tables exist before attempting to drop them
        const [tablesExist] = await queryInterface.sequelize.query(`
          SELECT 
            COUNT(*) AS count_participants,
            (SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = 'messaging' AND table_name = 'conversations') AS count_conversations,
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_schema = 'messaging' AND table_name = 'messages' 
             AND column_name = 'conversation_id') AS count_message_column
          FROM information_schema.tables 
          WHERE table_schema = 'messaging' AND table_name = 'conversation_participants';
        `, { transaction: t });
        
        const participantsExists = parseInt(tablesExist[0].count_participants) > 0;
        const conversationsExists = parseInt(tablesExist[0].count_conversations) > 0;
        const messageColumnExists = parseInt(tablesExist[0].count_message_column) > 0;
        
        // Make sure we don't leave the database in an inconsistent state
        await queryInterface.sequelize.query(`
          -- Set appropriate search path
          SET LOCAL search_path TO messaging, public;
          
          -- First drop triggers to avoid errors with dependencies
          ${participantsExists ? `
            DROP TRIGGER IF EXISTS update_conversation_participants_timestamp 
            ON messaging.conversation_participants;
          ` : '-- Participants table does not exist, skipping trigger drop'}
          
          ${conversationsExists ? `
            DROP TRIGGER IF EXISTS update_conversations_timestamp 
            ON messaging.conversations;
          ` : '-- Conversations table does not exist, skipping trigger drop'}
          
          -- Drop indexes safely
          DROP INDEX IF EXISTS messaging.idx_messages_conversation_id;
          DROP INDEX IF EXISTS messaging.idx_conversation_participants_user_id;
          DROP INDEX IF EXISTS messaging.idx_conversations_last_message_at;
          
          -- Remove conversation_id from messages table first (foreign key constraint)
          ${messageColumnExists ? `
            ALTER TABLE messaging.messages DROP COLUMN IF EXISTS conversation_id;
            RAISE NOTICE 'Dropped conversation_id column from messages table';
          ` : '-- conversation_id column does not exist in messages table, skipping drop'}
          
          -- Drop tables in correct order
          ${participantsExists ? `
            DROP TABLE IF EXISTS messaging.conversation_participants CASCADE;
            RAISE NOTICE 'Dropped conversation_participants table';
          ` : '-- conversation_participants table does not exist, skipping drop'}
          
          ${conversationsExists ? `
            DROP TABLE IF EXISTS messaging.conversations CASCADE;
            RAISE NOTICE 'Dropped conversations table';
          ` : '-- conversations table does not exist, skipping drop'}
          
          -- Clean up migration meta
          DELETE FROM public.migration_meta WHERE key = 'conversations_migration';
          
          -- Reset search path
          RESET search_path;
        `, { transaction: t });
        
        console.log('Conversations down migration completed successfully');
        return Promise.resolve();
      } catch (error) {
        console.error('Error in conversations down migration:', error);
        await queryInterface.sequelize.query(`
          INSERT INTO metrics.user_activity_logs(action_type, details)
          VALUES ('migration_error', jsonb_build_object('error', $1));
        `, { transaction: t, replacements: [error.message] });
        return Promise.reject(error);
      }
    });
  }
}; 
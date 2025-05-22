'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get existing users
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users LIMIT 4",
        { transaction: t }
      );
      
      // Get existing messages
      const [messages] = await queryInterface.sequelize.query(
        "SELECT id, sender_id, receiver_id, created_at FROM messaging.messages ORDER BY created_at DESC LIMIT 10",
        { transaction: t }
      );

      if (users.length < 2 || messages.length === 0) {
        console.log('Not enough users or messages to create conversations');
        return;
      }

      // Create conversations
      await queryInterface.sequelize.query(`
        INSERT INTO messaging.conversations (
          uuid, subject, last_message_at, is_deleted, created_at, updated_at
        ) VALUES 
          (uuid_generate_v4(), 'Project Discussion', NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '3 days', NOW()),
          (uuid_generate_v4(), 'General Inquiry', NOW() - INTERVAL '1 day', false, NOW() - INTERVAL '1 day', NOW()),
          (uuid_generate_v4(), 'Support Request', NOW() - INTERVAL '5 hours', false, NOW() - INTERVAL '5 hours', NOW())
        RETURNING id;
      `, { transaction: t });

      // Get created conversation IDs
      const [conversations] = await queryInterface.sequelize.query(
        "SELECT id FROM messaging.conversations ORDER BY created_at DESC LIMIT 3",
        { transaction: t }
      );

      if (conversations.length === 0) {
        console.log('Failed to create conversations');
        return;
      }

      // Add participants to conversations
      if (users.length >= 4) {
        await queryInterface.sequelize.query(`
          INSERT INTO messaging.conversation_participants (
            conversation_id, user_id, is_muted, is_deleted, created_at, updated_at
          ) VALUES
            (${conversations[0].id}, ${users[0].id}, false, false, NOW(), NOW()),
            (${conversations[0].id}, ${users[1].id}, false, false, NOW(), NOW()),
            (${conversations[1].id}, ${users[0].id}, false, false, NOW(), NOW()),
            (${conversations[1].id}, ${users[2].id}, false, false, NOW(), NOW()),
            (${conversations[2].id}, ${users[1].id}, false, false, NOW(), NOW()),
            (${conversations[2].id}, ${users[3].id}, false, false, NOW(), NOW());
        `, { transaction: t });
      }

      // Update some messages with conversation IDs if messages exist
      if (messages.length >= 5) {
        await queryInterface.sequelize.query(`
          UPDATE messaging.messages
          SET conversation_id = ${conversations[0].id}
          WHERE id IN (${messages[0].id}, ${messages[1].id});
          
          UPDATE messaging.messages
          SET conversation_id = ${conversations[1].id}
          WHERE id IN (${messages[2].id}, ${messages[3].id});
          
          UPDATE messaging.messages
          SET conversation_id = ${conversations[2].id}
          WHERE id = ${messages[4].id};
        `, { transaction: t });

        // Update conversations with last message info
        await queryInterface.sequelize.query(`
          UPDATE messaging.conversations
          SET last_message_id = ${messages[0].id}
          WHERE id = ${conversations[0].id};
          
          UPDATE messaging.conversations
          SET last_message_id = ${messages[2].id}
          WHERE id = ${conversations[1].id};
          
          UPDATE messaging.conversations
          SET last_message_id = ${messages[4].id}
          WHERE id = ${conversations[2].id};
        `, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Reset message conversation IDs
      await queryInterface.sequelize.query(`
        UPDATE messaging.messages SET conversation_id = NULL 
        WHERE conversation_id IS NOT NULL;
      `, { transaction: t });

      // Remove conversation data
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.conversation_participants;
        DELETE FROM messaging.conversations;
      `, { transaction: t });
    });
  }
}; 
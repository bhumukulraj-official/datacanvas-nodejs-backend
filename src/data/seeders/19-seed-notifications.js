'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get users from existing seed data
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users",
        { transaction: t }
      );

      // Get projects from existing seed data
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );

      // Create notifications with different types and states
      await queryInterface.sequelize.query(`
        INSERT INTO messaging.notifications (
          uuid, user_id, type, title, message, link, is_read, read_at, metadata, created_at
        ) VALUES
          (uuid_generate_v4(), ${users[0].id}, 'project_update', 
          'Project Update', 
          'Your project has been updated with new files', 
          '/projects/${projects[0].id}', 
          true, NOW() - INTERVAL '2 hours', 
          '{"project_id": ${projects[0].id}, "update_type": "file_upload"}', 
          NOW() - INTERVAL '3 hours'),
          
          (uuid_generate_v4(), ${users[1].id}, 'invoice_created', 
          'New Invoice Available', 
          'A new invoice has been created for your project', 
          '/invoices/latest', 
          false, NULL, 
          '{"invoice_id": 1, "amount": 1500.00}', 
          NOW() - INTERVAL '1 day'),
          
          (uuid_generate_v4(), ${users[2].id}, 'message_received', 
          'New Message', 
          'You have received a new message', 
          '/messages', 
          false, NULL, 
          '{"sender_id": ${users[0].id}, "message_preview": "We need to discuss..."}', 
          NOW() - INTERVAL '8 hours'),
          
          (uuid_generate_v4(), ${users[0].id}, 'payment_received', 
          'Payment Received', 
          'We have received your payment for invoice #INV-001', 
          '/payments/history', 
          true, NOW() - INTERVAL '5 days', 
          '{"payment_id": 1, "amount": 750.00, "invoice_id": 1}', 
          NOW() - INTERVAL '5 days'),
          
          (uuid_generate_v4(), ${users[3].id}, 'project_status_change', 
          'Project Status Changed', 
          'Your project status has been updated to "Completed"', 
          '/projects/${projects[1].id}', 
          false, NULL, 
          '{"project_id": ${projects[1].id}, "old_status": "in_progress", "new_status": "completed"}', 
          NOW() - INTERVAL '12 hours');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.notifications 
        WHERE id IN (
          SELECT id FROM messaging.notifications
          ORDER BY created_at DESC
          LIMIT 5
        );
      `, { transaction: t });
    });
  }
}; 
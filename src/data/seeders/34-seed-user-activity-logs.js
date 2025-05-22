'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get user IDs
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users LIMIT 3",
        { transaction: t }
      );
      
      if (users.length === 0) {
        console.log('No users found to create activity logs');
        return;
      }
      
      // Get project IDs
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects LIMIT 2",
        { transaction: t }
      );
      
      // Get invoice IDs
      const [invoices] = await queryInterface.sequelize.query(
        "SELECT id FROM billing.invoices LIMIT 2",
        { transaction: t }
      );
      
      // Create sample activity logs
      await queryInterface.sequelize.query(`
        INSERT INTO metrics.user_activity_logs (
          user_id, action_type, entity_type, entity_id, details, 
          ip_address, user_agent, created_at
        ) VALUES
          (
            ${users[0].id}, 
            'login', 
            'auth.users', 
            ${users[0].id}, 
            '{"method": "password", "success": true}', 
            '192.168.1.100', 
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '1 hour'
          ),
          (
            ${users[0].id}, 
            'create', 
            'content.projects', 
            ${projects.length > 0 ? projects[0].id : 'NULL'}, 
            '{"title": "New Project", "description": "Project created through UI"}', 
            '192.168.1.100', 
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '45 minutes'
          ),
          (
            ${users[1].id}, 
            'login', 
            'auth.users', 
            ${users[1].id}, 
            '{"method": "password", "success": true}', 
            '192.168.1.101', 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 
            NOW() - INTERVAL '2 hours'
          ),
          (
            ${users[1].id}, 
            'update', 
            'content.projects', 
            ${projects.length > 0 ? projects[0].id : 'NULL'}, 
            '{"changed": {"description": "Updated project description"}}', 
            '192.168.1.101', 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 
            NOW() - INTERVAL '1 hour 45 minutes'
          ),
          (
            ${users[2].id}, 
            'login', 
            'auth.users', 
            ${users[2].id}, 
            '{"method": "password", "success": true}', 
            '192.168.1.102', 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '3 hours'
          ),
          (
            ${users[2].id}, 
            'view', 
            'billing.invoices', 
            ${invoices.length > 0 ? invoices[0].id : 'NULL'}, 
            '{"invoice_number": "INV-001"}', 
            '192.168.1.102', 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '2 hours 50 minutes'
          ),
          (
            ${users[0].id}, 
            'create', 
            'billing.invoices', 
            ${invoices.length > 0 ? invoices[1].id : 'NULL'}, 
            '{"invoice_number": "INV-002", "amount": 1500.00}', 
            '192.168.1.100', 
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '30 minutes'
          ),
          (
            ${users[0].id}, 
            'logout', 
            'auth.users', 
            ${users[0].id}, 
            '{"session_duration": 3600}', 
            '192.168.1.100', 
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            NOW() - INTERVAL '15 minutes'
          );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM metrics.user_activity_logs
        WHERE id IN (
          SELECT id FROM metrics.user_activity_logs
          ORDER BY created_at DESC
          LIMIT 8
        );
      `, { transaction: t });
    });
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get users for rate limit entries
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users LIMIT 2",
        { transaction: t }
      );

      // First, delete any existing rate limit configs that we're about to insert
      await queryInterface.sequelize.query(`
        DELETE FROM public_api.rate_limit_configs 
        WHERE endpoint_pattern IN (
          '/api/v1/public/*', 
          '/api/v1/admin/*', 
          '/api/v1/auth/reset-password/*', 
          '/api/v1/contact',
          '/api/v1/projects/*',
          '/api/v1/messages/*',
          '/api/v1/billing/*',
          '/api/v1/files/upload'
        );
      `, { transaction: t });

      // Then insert the configs
      await queryInterface.sequelize.query(`
        INSERT INTO public_api.rate_limit_configs 
        (endpoint_pattern, requests_limit, window_size_seconds, entity_type, description, is_active)
        VALUES
          ('/api/v1/public/*', 100, 60, 'ip', 'Public APIs: 100 requests per minute', true),
          ('/api/v1/admin/*', 1000, 60, 'user', 'Admin APIs: 1000 requests per minute', true),
          ('/api/v1/auth/reset-password/*', 5, 60, 'ip', 'Password reset: 5 requests per minute', true),
          ('/api/v1/contact', 3, 60, 'ip', 'Contact form: 3 submissions per minute', true),
          ('/api/v1/projects/*', 200, 60, 'user', 'Projects APIs: 200 requests per minute', true),
          ('/api/v1/messages/*', 150, 60, 'user', 'Messaging APIs: 150 requests per minute', true),
          ('/api/v1/billing/*', 50, 60, 'user', 'Billing APIs: 50 requests per minute', true),
          ('/api/v1/files/upload', 20, 60, 'user', 'File uploads: 20 uploads per minute', true);
      `, { transaction: t });

      // Insert sample rate limit data
      await queryInterface.sequelize.query(`
        INSERT INTO public_api.rate_limits
        (entity_type, entity_identifier, endpoint, requests_count, window_start, window_size_seconds, is_authenticated)
        VALUES
          ('ip', '192.168.1.100', '/api/v1/public/projects', 35, NOW() - INTERVAL '30 seconds', 60, false),
          ('ip', '192.168.1.101', '/api/v1/contact', 2, NOW() - INTERVAL '45 seconds', 60, false),
          ('ip', '192.168.1.102', '/api/v1/auth/reset-password', 4, NOW() - INTERVAL '15 seconds', 60, false),
          ('user', '${users[0].id}', '/api/v1/admin/users', 250, NOW() - INTERVAL '50 seconds', 60, true),
          ('user', '${users[1].id}', '/api/v1/projects/1', 75, NOW() - INTERVAL '40 seconds', 60, true),
          ('user', '${users[0].id}', '/api/v1/messages', 30, NOW() - INTERVAL '25 seconds', 60, true),
          ('api_key', 'apk_test123456789', '/api/v1/public/projects', 450, NOW() - INTERVAL '35 seconds', 60, true);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Delete rate limits first
      await queryInterface.sequelize.query(`
        DELETE FROM public_api.rate_limits;
      `, { transaction: t });
      
      // Delete rate limit configs
      await queryInterface.sequelize.query(`
        DELETE FROM public_api.rate_limit_configs 
        WHERE endpoint_pattern IN (
          '/api/v1/public/*', 
          '/api/v1/admin/*', 
          '/api/v1/auth/reset-password/*', 
          '/api/v1/contact',
          '/api/v1/projects/*',
          '/api/v1/messages/*',
          '/api/v1/billing/*',
          '/api/v1/files/upload'
        );
      `, { transaction: t });
    });
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    return queryInterface.bulkInsert('rate_limits', [
      {
        ip_address: '192.168.1.100',
        endpoint: '/api/auth/login',
        request_count: 15,
        window_start: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        window_end: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        api_type: 'public',
        user_id: 4, // regular_user
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '10.0.0.5',
        endpoint: '/api/users',
        request_count: 50,
        window_start: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        window_end: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes from now
        api_type: 'admin',
        user_id: 1, // admin_user
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '203.0.113.42',
        endpoint: '/api/blog/posts',
        request_count: 100,
        window_start: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        window_end: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        api_type: 'public',
        user_id: null, // anonymous
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '172.16.254.1',
        endpoint: '/api/users/profile',
        request_count: 25,
        window_start: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        window_end: new Date(now.getTime() + 50 * 60 * 1000), // 50 minutes from now
        api_type: 'private',
        user_id: 3, // writer_one
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '198.51.100.73',
        endpoint: '/api/media/upload',
        request_count: 5,
        window_start: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        window_end: new Date(now.getTime() + 55 * 60 * 1000), // 55 minutes from now
        api_type: 'private',
        user_id: 2, // editor_main
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        endpoint: '/api/search',
        request_count: 200,
        window_start: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        window_end: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        api_type: 'public',
        user_id: null, // anonymous
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '10.1.1.10',
        endpoint: '/api/analytics/dashboard',
        request_count: 30,
        window_start: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        window_end: new Date(now.getTime() + 45 * 60 * 1000), // 45 minutes from now
        api_type: 'admin',
        user_id: 1, // admin_user
        created_at: now,
        updated_at: now
      },
      {
        ip_address: '192.168.10.50',
        endpoint: '/api/websocket/connect',
        request_count: 10,
        window_start: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        window_end: new Date(now.getTime() + 90 * 60 * 1000), // 90 minutes from now
        api_type: 'private',
        user_id: 5, // content_creator
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('rate_limits', null, {});
  }
}; 
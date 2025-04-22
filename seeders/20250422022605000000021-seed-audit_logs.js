'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    return queryInterface.bulkInsert('audit_logs', [
      {
        user_id: 1, // admin_user
        action: 'USER_CREATE',
        entity_type: 'user',
        entity_id: 8,
        description: 'Created a new user account',
        metadata: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user'
        }),
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 2, // editor_main
        action: 'BLOG_POST_PUBLISH',
        entity_type: 'blog_post',
        entity_id: 45,
        description: 'Published blog post',
        metadata: JSON.stringify({
          title: 'New Features Release',
          category_id: 3
        }),
        ip_address: '10.0.0.15',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 1, // admin_user
        action: 'USER_SUSPEND',
        entity_type: 'user',
        entity_id: 7,
        description: 'Suspended user account',
        metadata: JSON.stringify({
          reason: 'Violation of terms of service',
          duration: '30 days'
        }),
        ip_address: '10.0.0.5',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: 4, // regular_user
        action: 'PASSWORD_CHANGE',
        entity_type: 'user',
        entity_id: 4,
        description: 'Changed account password',
        metadata: JSON.stringify({
          ip_changed_from: '198.51.100.42'
        }),
        ip_address: '198.51.100.73',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: 5, // content_creator
        action: 'MEDIA_UPLOAD',
        entity_type: 'media',
        entity_id: 112,
        description: 'Uploaded new media file',
        metadata: JSON.stringify({
          filename: 'project-screenshot.png',
          size: 1245678,
          mime_type: 'image/png'
        }),
        ip_address: '172.16.254.1',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        user_id: 1, // admin_user
        action: 'SYSTEM_SETTINGS_UPDATE',
        entity_type: 'settings',
        entity_id: 1,
        description: 'Updated system settings',
        metadata: JSON.stringify({
          changed_fields: ['site_name', 'contact_email', 'maintenance_mode']
        }),
        ip_address: '10.0.0.5',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        updated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      },
      {
        user_id: 3, // writer_one
        action: 'BLOG_POST_UPDATE',
        entity_type: 'blog_post',
        entity_id: 42,
        description: 'Updated blog post content',
        metadata: JSON.stringify({
          title: 'Technology Trends 2023',
          changes: ['content', 'tags']
        }),
        ip_address: '203.0.113.42',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        created_at: new Date(now.getTime() - 18 * 60 * 60 * 1000), // 18 hours ago
        updated_at: new Date(now.getTime() - 18 * 60 * 60 * 1000)
      },
      {
        user_id: null, // system or anonymous
        action: 'SECURITY_ALERT',
        entity_type: 'security',
        entity_id: null,
        description: 'Multiple failed login attempts detected',
        metadata: JSON.stringify({
          attempts: 5,
          username: 'admin_user',
          action_taken: 'temporary_lock'
        }),
        ip_address: '198.51.100.42',
        user_agent: null,
        created_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        updated_at: new Date(now.getTime() - 30 * 60 * 1000)
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('audit_logs', null, {});
  }
}; 
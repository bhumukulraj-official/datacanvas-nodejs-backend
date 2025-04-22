'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('notifications', [
      {
        user_id: 1,
        type: 'system',
        title: 'Welcome to DataCanvas',
        message: 'Thank you for joining DataCanvas! Start by completing your profile and exploring our features.',
        read: true,
        category: 'onboarding',
        priority: 'high',
        status: 'read',
        metadata: JSON.stringify({
          action_url: '/onboarding',
          action_text: 'Complete Setup',
          expiry: null
        }),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updated_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
        deleted_at: null
      },
      {
        user_id: 2,
        type: 'account',
        title: 'Password Changed Successfully',
        message: 'Your account password was changed successfully. If you did not make this change, please contact support immediately.',
        read: true,
        category: 'security',
        priority: 'high',
        status: 'read',
        metadata: JSON.stringify({
          action_url: '/security/password',
          action_text: 'Review Activity',
          ip_address: '192.168.1.1',
          browser: 'Chrome 91.0.4472.124',
          os: 'Windows 10'
        }),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        deleted_at: null
      },
      {
        user_id: 3,
        type: 'content',
        title: 'New Comment on Your Blog Post',
        message: 'User "john_doe" commented on your blog post "Getting Started with React Hooks".',
        read: false,
        category: 'engagement',
        priority: 'medium',
        status: 'unread',
        metadata: JSON.stringify({
          action_url: '/blog/posts/123/comments',
          action_text: 'View Comment',
          comment_id: 456,
          blog_post_id: 123,
          commenter_id: 789
        }),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        deleted_at: null
      },
      {
        user_id: 4,
        type: 'project',
        title: 'Project Deadline Approaching',
        message: 'Your project "E-commerce Redesign" is due in 2 days. Please ensure all deliverables are uploaded.',
        read: false,
        category: 'reminder',
        priority: 'high',
        status: 'unread',
        metadata: JSON.stringify({
          action_url: '/projects/234',
          action_text: 'View Project',
          project_id: 234,
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          completion_percentage: 75
        }),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        deleted_at: null
      },
      {
        user_id: 5,
        type: 'billing',
        title: 'Subscription Renewal Successful',
        message: 'Your premium subscription has been renewed successfully. The next billing date is July 15, 2023.',
        read: true,
        category: 'account',
        priority: 'medium',
        status: 'read',
        metadata: JSON.stringify({
          action_url: '/account/billing',
          action_text: 'Manage Subscription',
          transaction_id: 'txn_12345',
          amount: 99.99,
          next_billing_date: '2023-07-15',
          plan: 'premium'
        }),
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        deleted_at: null
      },
      {
        user_id: 1,
        type: 'system',
        title: 'New Feature: Dark Mode',
        message: 'We\'ve added Dark Mode to DataCanvas! Try it out by clicking the toggle in your user settings.',
        read: false,
        category: 'feature',
        priority: 'low',
        status: 'unread',
        metadata: JSON.stringify({
          action_url: '/settings/appearance',
          action_text: 'Try Dark Mode',
          feature_id: 'dark_mode',
          release_version: '2.4.0'
        }),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        deleted_at: null
      },
      {
        user_id: 2,
        type: 'social',
        title: 'New Follower',
        message: 'User "design_master" has started following your portfolio.',
        read: true,
        category: 'engagement',
        priority: 'low',
        status: 'archived',
        metadata: JSON.stringify({
          action_url: '/profile/followers',
          action_text: 'View Followers',
          follower_id: 321,
          follower_name: 'Design Master',
          follower_avatar: 'https://example.com/avatars/design_master.jpg'
        }),
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        deleted_at: null
      },
      {
        user_id: 3,
        type: 'security',
        title: 'Unusual Login Detected',
        message: 'We detected a login to your account from a new location. If this was you, you can ignore this message.',
        read: true,
        category: 'security',
        priority: 'critical',
        status: 'read',
        metadata: JSON.stringify({
          action_url: '/security/activity',
          action_text: 'Review Login',
          ip_address: '203.0.113.45',
          location: 'San Francisco, CA, United States',
          device: 'iPhone 12',
          browser: 'Safari 15.1',
          time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days ago
        }),
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('notifications', null, {});
  }
}; 
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('contact_submissions', [
      {
        name: 'Thomas Anderson',
        email: 'thomas.anderson@example.com',
        subject: 'Partnership Opportunity',
        message: 'I would like to discuss a potential partnership between our companies. We have been following your work and believe there could be synergies to explore.',
        status: 'new',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        recaptcha_token: 'token_example_1',
        recaptcha_score: 0.9,
        assigned_to: null,
        replied_at: null,
        reply_message: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Olivia Bennett',
        email: 'olivia.bennett@example.com',
        subject: 'Technical Support Request',
        message: 'I am experiencing issues with the login functionality on your platform. After entering my credentials, the page refreshes but I remain logged out. Please advise on how to resolve this.',
        status: 'read',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        recaptcha_token: 'token_example_2',
        recaptcha_score: 0.95,
        assigned_to: 1,
        replied_at: null,
        reply_message: null,
        notes: 'User has been contacted via phone, troubleshooting in progress.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        deleted_at: null
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus.johnson@example.com',
        subject: 'Feedback on New Features',
        message: 'I wanted to share some positive feedback on your recent platform updates. The new dashboard analytics are exactly what I needed for my reporting requirements.',
        status: 'replied',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        recaptcha_token: 'token_example_3',
        recaptcha_score: 0.92,
        assigned_to: 2,
        replied_at: new Date(),
        reply_message: 'Thank you for your positive feedback, Marcus! We\'re glad to hear the new analytics features are helpful for your reporting needs. Let us know if you have any suggestions for future improvements.',
        notes: 'Customer seems satisfied with response.',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Sophia Williams',
        email: 'sophia.williams@example.com',
        subject: 'Account Deletion Request',
        message: 'I would like to request the deletion of my account and all associated data from your platform. Please confirm when this has been completed.',
        status: 'replied',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        recaptcha_token: 'token_example_4',
        recaptcha_score: 0.89,
        assigned_to: 1,
        replied_at: new Date(),
        reply_message: 'Hello Sophia, we have processed your account deletion request. All your data has been removed from our systems as per our privacy policy. If you have any further questions, please don\'t hesitate to contact us.',
        notes: 'Account deletion completed on ' + new Date().toISOString().split('T')[0],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Daniel Lee',
        email: 'daniel.lee@spamexample.com',
        subject: 'You won a prize!!!',
        message: 'Congratulations! You have been selected as the winner of our exclusive giveaway. Click the link to claim your prize now!!!',
        status: 'spam',
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        recaptcha_token: 'token_example_5',
        recaptcha_score: 0.2,
        assigned_to: null,
        replied_at: null,
        reply_message: null,
        notes: 'Automatically marked as spam due to low reCAPTCHA score and content pattern matching.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deleted_at: null
      },
      {
        name: 'Emma Garcia',
        email: 'emma.garcia@example.com',
        subject: 'Feature Request: Calendar Integration',
        message: 'I love using your platform but would find it even more valuable if it had calendar integration with Google Calendar and Outlook. This would help me manage project deadlines more effectively.',
        status: 'archived',
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
        recaptcha_token: 'token_example_6',
        recaptcha_score: 0.94,
        assigned_to: 3,
        replied_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        reply_message: 'Hi Emma, thank you for your suggestion! We\'re actually planning to add calendar integrations in our next major update. We\'ll add you to our beta tester list so you can try it out before the public release.',
        notes: 'Feature already in development roadmap. User added to beta testing program.',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        deleted_at: null
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        subject: 'Billing Inquiry',
        message: 'I noticed an unexpected charge on my subscription this month. Could you please review my account and explain this charge?',
        status: 'new',
        ip_address: '192.168.1.106',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78',
        recaptcha_token: 'token_example_7',
        recaptcha_score: 0.91,
        assigned_to: null,
        replied_at: null,
        reply_message: null,
        notes: null,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        deleted_at: null
      },
      {
        name: 'Ava Thompson',
        email: 'ava.thompson@example.com',
        subject: 'Job Application Inquiry',
        message: 'I recently applied for the Senior Developer position at your company and wanted to follow up on the status of my application. I\'m very excited about the opportunity to join your team.',
        status: 'read',
        ip_address: '192.168.1.107',
        user_agent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        recaptcha_token: 'token_example_8',
        recaptcha_score: 0.96,
        assigned_to: 2,
        replied_at: null,
        reply_message: null,
        notes: 'Forwarded to HR department.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('contact_submissions', null, {});
  }
}; 
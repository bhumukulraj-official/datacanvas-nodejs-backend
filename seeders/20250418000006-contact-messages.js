'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample contact messages
    await queryInterface.bulkInsert('contact_messages', [
      {
        user_id: adminId, // User who received the message
        name: 'Robert Chen',
        email: 'robert.chen@example.com',
        subject: 'Project Collaboration Opportunity',
        message: 'Hello, I came across your portfolio and was really impressed with your work. I represent a startup in the fintech space, and we\'re looking for a skilled developer to help us build our new platform. Would you be interested in discussing potential collaboration? We can set up a call to discuss the details further.',
        status: 'unread',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: adminId,
        name: 'Emily Parker',
        email: 'emily.parker@example.com',
        subject: 'Speaking Engagement Request',
        message: 'Hi there, I\'m organizing a tech conference next month focused on modern web development practices. Based on your experience and the projects in your portfolio, I think you would be a great speaker for our event. We can cover travel expenses and provide an honorarium. Would you be interested in giving a talk on React or Node.js best practices? Please let me know at your earliest convenience.',
        status: 'read',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Read 1 day after
      },
      {
        user_id: adminId,
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        subject: 'Website Redesign Consultation',
        message: 'Hello, my company is looking to redesign our corporate website to make it more modern and responsive. After reviewing your portfolio, I believe you have the skills we need. We\'re a mid-sized marketing agency with about 50 employees. Could we schedule a consultation to discuss our requirements and your availability for such a project? I\'d appreciate your insights on how we should approach this redesign.',
        status: 'replied',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Updated 2 days after
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      await queryInterface.bulkDelete('contact_messages', { user_id: adminId }, {});
    }
  }
}; 
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`
    );
    const userMap = users[0].reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const auditLogs = [
      {
        user_id: userMap['admin'],
        action: 'create',
        entity_type: 'project',
        entity_id: 1,
        description: 'Created a new project: Enterprise Resource Planning System',
        metadata: JSON.stringify({
          project_name: 'Enterprise Resource Planning System',
          status: 'completed'
        }),
        created_at: new Date()
      },
      {
        user_id: userMap['john_doe'],
        action: 'update',
        entity_type: 'profile',
        entity_id: 2,
        description: 'Updated profile information',
        metadata: JSON.stringify({
          updated_fields: ['bio', 'title'],
          old_values: {
            bio: 'Web developer',
            title: 'Developer'
          },
          new_values: {
            bio: 'Senior Web Developer',
            title: 'Senior Developer'
          }
        }),
        created_at: new Date()
      },
      {
        user_id: userMap['jane_smith'],
        action: 'delete',
        entity_type: 'blog_post',
        entity_id: 3,
        description: 'Deleted a blog post',
        metadata: JSON.stringify({
          post_title: 'Old Blog Post',
          reason: 'Content outdated'
        }),
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('audit_logs', auditLogs, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('audit_logs', null, {});
  }
}; 
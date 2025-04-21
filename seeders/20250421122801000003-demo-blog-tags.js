'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('blog_tags', [
      {
        name: 'JavaScript',
        slug: 'javascript',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'React',
        slug: 'react',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Node.js',
        slug: 'nodejs',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Python',
        slug: 'python',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'UI/UX',
        slug: 'ui-ux',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'API',
        slug: 'api',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Database',
        slug: 'database',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Security',
        slug: 'security',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('blog_tags', null, {});
  }
}; 
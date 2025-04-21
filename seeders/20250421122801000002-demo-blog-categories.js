'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('blog_categories', [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Articles about technology and innovation',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Articles about web development and programming',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Design',
        slug: 'design',
        description: 'Articles about UI/UX design and graphic design',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Articles about business and entrepreneurship',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('blog_categories', null, {});
  }
}; 
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs from the database
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a mapping of usernames to IDs
    const userIds = users.reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    // Insert testimonials for each user
    return queryInterface.bulkInsert('testimonials', [
      {
        user_id: userIds['admin'],
        author_name: 'Tech Solutions Inc.',
        author_title: 'CTO',
        content: 'Working with this team was an absolute pleasure. They delivered a high-quality ERP system that exceeded our expectations.',
        rating: 5,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        author_name: 'Sarah Johnson',
        author_title: 'Product Manager',
        content: 'John\'s task management app has revolutionized how our team collaborates. Highly recommended!',
        rating: 5,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        author_name: 'Michael Chen',
        author_title: 'Design Director',
        content: 'Jane\'s design system has become the foundation of our product development process. It\'s comprehensive and well-documented.',
        rating: 5,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('testimonials', null, {});
  }
}; 
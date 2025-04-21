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

    // Insert notifications
    return queryInterface.bulkInsert('notifications', [
      {
        user_id: userIds['admin'],
        type: 'system',
        title: 'Welcome to DataCanvas',
        message: 'Thank you for joining DataCanvas. Start building your portfolio!',
        read: false,
        category: 'welcome',
        priority: 'high',
        created_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        type: 'project',
        title: 'New Project Comment',
        message: 'Someone commented on your Task Management App project',
        read: false,
        category: 'interaction',
        priority: 'medium',
        created_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        type: 'profile',
        title: 'Profile View',
        message: 'Your profile was viewed by a potential employer',
        read: true,
        category: 'profile',
        priority: 'low',
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('notifications', null, {});
  }
}; 
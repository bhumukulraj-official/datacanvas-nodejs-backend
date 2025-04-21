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

    // Insert projects for each user
    return queryInterface.bulkInsert('projects', [
      // Admin's projects
      {
        user_id: userIds['admin'],
        title: 'Enterprise Resource Planning System',
        description: 'A comprehensive ERP system built with Node.js and React',
        thumbnail_url: 'https://example.com/images/erp-system.jpg',
        tags: ['Enterprise', 'Business', 'Management'],
        technologies: ['Node.js', 'React', 'PostgreSQL', 'Redis'],
        github_url: 'https://github.com/admin/erp-system',
        live_url: 'https://erp-system.example.com',
        is_featured: true,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['admin'],
        title: 'E-commerce Platform',
        description: 'A full-featured e-commerce platform with payment integration',
        thumbnail_url: 'https://example.com/images/ecommerce.jpg',
        tags: ['E-commerce', 'Shopping', 'Payment'],
        technologies: ['Node.js', 'React', 'MongoDB', 'Stripe'],
        github_url: 'https://github.com/admin/ecommerce',
        live_url: 'https://ecommerce.example.com',
        is_featured: true,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      },
      // John Doe's projects
      {
        user_id: userIds['johndoe'],
        title: 'Task Management App',
        description: 'A React-based task management application with real-time updates',
        thumbnail_url: 'https://example.com/images/task-manager.jpg',
        tags: ['Productivity', 'Management', 'Real-time'],
        technologies: ['React', 'Redux', 'Firebase', 'Material-UI'],
        github_url: 'https://github.com/johndoe/task-manager',
        live_url: 'https://task-manager.example.com',
        is_featured: true,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Jane Smith's projects
      {
        user_id: userIds['janesmith'],
        title: 'Design System',
        description: 'A comprehensive design system for web applications',
        thumbnail_url: 'https://example.com/images/design-system.jpg',
        tags: ['Design', 'UI/UX', 'System'],
        technologies: ['Figma', 'Storybook', 'React'],
        github_url: 'https://github.com/janesmith/design-system',
        live_url: 'https://design-system.example.com',
        is_featured: true,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('projects', null, {});
  }
}; 
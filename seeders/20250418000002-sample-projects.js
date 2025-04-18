'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample projects
    await queryInterface.bulkInsert('projects', [
      {
        user_id: adminId,
        title: 'E-commerce Platform',
        description: 'A full-featured e-commerce platform built with React, Node.js, and PostgreSQL. Features include product listings, cart management, user authentication, payment processing, and order tracking.',
        thumbnail_url: 'ecommerce-thumbnail.jpg',
        tags: JSON.stringify(['e-commerce', 'fullstack', 'react']),
        technologies: JSON.stringify(['React', 'Node.js', 'Express', 'PostgreSQL', 'Redux', 'Stripe']),
        github_url: 'https://github.com/username/ecommerce-platform',
        live_url: 'https://ecommerce-demo.example.com',
        is_featured: true,
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        title: 'Task Management App',
        description: 'A productive task management application with drag-and-drop interface, team collaboration features, and real-time updates using WebSockets.',
        thumbnail_url: 'taskapp-thumbnail.jpg',
        tags: JSON.stringify(['productivity', 'collaboration', 'react']),
        technologies: JSON.stringify(['React', 'TypeScript', 'Node.js', 'MongoDB', 'Socket.io']),
        github_url: 'https://github.com/username/task-manager',
        live_url: 'https://tasks-demo.example.com',
        is_featured: true,
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        title: 'Weather Dashboard',
        description: 'An interactive weather dashboard that displays current weather conditions and forecasts for multiple locations. Features include interactive maps, charts, and location search.',
        thumbnail_url: 'weather-thumbnail.jpg',
        tags: JSON.stringify(['weather', 'dashboard', 'api']),
        technologies: JSON.stringify(['JavaScript', 'Vue.js', 'OpenWeatherMap API', 'Chart.js']),
        github_url: 'https://github.com/username/weather-dashboard',
        live_url: 'https://weather-demo.example.com',
        is_featured: false,
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      await queryInterface.bulkDelete('projects', { user_id: adminId }, {});
    }
  }
}; 